/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../../BaseJii');
const String = require('../../helpers/String');
const TransportInterface = require('./transport/TransportInterface');
const RequestEvent = require('./RequestEvent');
const MessageEvent = require('./MessageEvent');
const ChannelEvent = require('../ChannelEvent');
const _indexOf = require('lodash/indexOf');
const _each = require('lodash/each');
const Component = require('../../base/Component');
const AutoReconnect = require('./plugin/AutoReconnect');

/**
 * Read-only from api stationUid
 * @type {null}
 */
var stationUid = null;

class Client extends Component {

    preInit() {
        this._subscribes = [];

        /**
         * @type {object}
         */
        this._requestsInProcess = {};

        /**
         * @type {boolean}
         */
        this._forceClosed = false;

        /**
         * @type {boolean}
         */
        this._isOpened = false;

        /**
         * Url to comet server
         * @type {string}
         */
        this._serverUrl = '';

        /**
         * @type {boolean}
         */
        this.autoSubscribeOnReconnect = true;

        /**
         * @type {boolean}
         */
        this.autoOpen = true;

        /**
         * Max comet workers number. Used for auto generate different server urls (balancer).
         */
        this.workersCount = null;

        this.plugins = {

            /**
             * @type {AutoReconnect}
             */
            autoReconnect: {
                className: AutoReconnect
            }
        };

        /**
         * @type {TransportInterface}
         */
        this.transport = null;

        super.preInit(...arguments);
    }

    init() {
        stationUid = String.generateUid();

        // Init transport
        this.transport = Jii.createObject(this.transport);
        this.transport.on(TransportInterface.EVENT_OPEN, this._onOpen.bind(this));
        this.transport.on(TransportInterface.EVENT_CLOSE, this._onClose.bind(this));
        this.transport.on(TransportInterface.EVENT_MESSAGE, this._onMessage.bind(this));

        // Init plugins
        _each(this.plugins, (config, name) => {
            config.comet = this;
            this.plugins[name] = Jii.createObject(config);
        });

        // Auto open
        if (this.autoOpen) {
            this.open();
        }
    }

    /**
     * Set url to comet server
     * Detect server url by pattern, if set. Used for balancer server by clients random().
     * @param {string} value
     */
    setServerUrl(value) {
        // Normalize
        if (value.indexOf('//') === 0) {
            var sslSuffix = location.protocol === 'https' ? 's' : '';
            value = 'http' + sslSuffix + ':' + value;
        }

        // Balancer
        if (value.indexOf('{workerIndex}') !== -1) {
            var min = 0;
            var max = Math.max(this.workersCount || 0, 1) - 1;
            var workerIndex = min + Math.floor(Math.random() * (max - min + 1));
            value = value.replace('{workerIndex}', String(workerIndex));
        }

        // Switch server URL protocol to HTTP instead of HTTPS if browser is IE9 or lesser
        var isIE = window.navigator && (/MSIE/.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent));
        if (isIE && window.document && window.document.all && !window.atob) {
            var isSsl = /^(http|ws)s/.test(value);
            if (isSsl === location.protocol === 'https') {
                value = value.replace(/^(http|ws)s/, '$1');
            }
        }

        this._serverUrl = value;
    }

    /**
     * Return comet server url
     * @returns {string}
     */
    getServerUrl() {
        return this._serverUrl;
    }

    /**
     * Return station UID - unique id of current javascript environment (browser tab)
     * @returns {null}
     */
    getStationUid() {
        return stationUid;
    }

    /**
     * Return true, if connection is opened
     * @returns {boolean}
     */
    isOpened() {
        return this._isOpened;
    }

    /**
     * Return true, if connection closed by client (manually)
     * @returns {boolean}
     */
    isForceClosed() {
        return this._forceClosed;
    }

    /**
     * Open connection
     */
    open() {
        this._forceClosed = false;
        if (!this._isOpened) {
            this.transport.open(this._serverUrl);
        }
    }

    /**
     * Close connection
     */
    close() {
        this._forceClosed = true;
        if (this._isOpened) {
            this.transport.close();
        }
    }

    /**
     *
     * @param {string} name
     * @param {function} handler
     * @param {*} [data]
     * @param {boolean} [isAppend]
     */
    on(name, handler, data, isAppend) {
        // Subscribe on hub channels
        if (name === Client.EVENT_CHANNEL && !this.hasEventHandlers(name)) {
            this.subscribe(Client.CHANNEL_NAME_ALL);
        }
        if (name.indexOf(Client.EVENT_CHANNEL_NAME) === 0) {
            this.subscribe(name.substr(Client.EVENT_CHANNEL_NAME.length));
        }

        super.on(...arguments);
    }

    /**
     * @param {string} name
     * @param {function} [handler]
     * @return boolean
     */
    off(name, handler) {
        super.off(...arguments);

        // Unsubscribe on hub channels
        if (name === Client.EVENT_CHANNEL && !this.hasEventHandlers(name)) {
            this.unsubscribe(Client.CHANNEL_NAME_ALL);
        }
        if (name.indexOf(Client.EVENT_CHANNEL_NAME) === 0) {
            this.unsubscribe(name.substr(Client.EVENT_CHANNEL_NAME.length));
        }
    }

    /**
     * @param {string} channel
     */
    subscribe(channel) {
        if (_indexOf(this._subscribes, channel) === -1) {
            this._sendInternal('subscribe ' + channel);
            this._subscribes.push(channel);
        }
    }

    /**
     * @param {string} channel
     */
    unsubscribe(channel) {
        var index = _indexOf(this._subscribes, channel);
        if (index !== -1) {
            this._sendInternal('unsubscribe ' + channel);
            this._subscribes.splice(index, 1);
        }
    }

    /**
     *
     * @param {string} name
     * @returns {boolean}
     */
    hasChannelHandlers(name) {
        return this.hasEventHandlers(Client.EVENT_CHANNEL_NAME + name);
    }

    /**
     *
     * @param {string} channel
     * @param {object} data
     */
    send(channel, data) {
        if (typeof data !== 'string') {
            data = JSON.stringify(data);
        }

        this._sendInternal('channel ' + channel + ' ' + data);
    }

    /**
     *
     * @param {string} route
     * @param {object} [data]
     */
    request(route, data) {
        data = data || {};
        data.requestUid = String.generateUid();

        // Trigger event for append data
        var event = new RequestEvent({
            route: route,
            params: data
        });
        this.trigger(Client.EVENT_BEFORE_REQUEST, event);
        data = event.params;

        // Generate promise for wait response
        var promise = new Promise(resolve => {
            this._requestsInProcess[data.requestUid] = {
                route: route,
                resolve: resolve
            };
        });

        // Send request
        this._sendInternal('action ' + route + ' ' + JSON.stringify(data));

        return promise;
    }

    /**
     *
     * @param {string} message
     * @private
     */
    _sendInternal(message) {
        // Trigger event before send message
        var event = new MessageEvent({
            message: message
        });
        this.trigger(Client.EVENT_BEFORE_SEND, event);
        message = event.message;

        if (this._isOpened) {
            this.transport.send(message);
        }
    }

    _onOpen(event) {
        if (!this._isOpened) {
            this._isOpened = true;

            if (this.autoSubscribeOnReconnect) {
                var channels = this._subscribes;
                this._subscribes = [];
                _each(channels, this.subscribe.bind(this));
            }

            this.trigger(Client.EVENT_OPEN, event);
        }
    }

    _onClose(event) {
        if (this._isOpened) {
            this._isOpened = false;
            this.trigger(Client.EVENT_CLOSE, event);
        }
    }

    _onMessage(event) {
        if (event.message.indexOf('action ') === 0) {
            var response = JSON.parse(event.message.substr(7));
            if (response.requestUid && this._requestsInProcess[response.requestUid]) {
                this._requestsInProcess[response.requestUid].resolve(response);

                // Trigger request event
                this.trigger(Client.EVENT_REQUEST, new RequestEvent({
                    route: this._requestsInProcess[response.requestUid].route,
                    params: response
                }));

                delete this._requestsInProcess[response.requestUid];
            }
        }

        if (event.message.indexOf('channel ') === 0) {
            var message = event.message.substr(8);
            var i = message.indexOf(' ');
            var messageString = message.substr(i + 1);
            var params = messageString.match(/^[\{\[]/) ? JSON.parse(messageString) : null;

            var channelEvent = new ChannelEvent({
                channel: message.substr(0, i),
                params: params,
                message: !params ? messageString : null
            });

            // Trigger channel and channel:* events
            this.trigger(Client.EVENT_CHANNEL_NAME + channelEvent.channel, channelEvent);
            this.trigger(Client.EVENT_CHANNEL, channelEvent);
        }

        // Trigger message event
        this.trigger(Client.EVENT_MESSAGE, new MessageEvent({
            message: event.message
        }));
    }

}

/**
 * @type {string}
 */
Client.CHANNEL_NAME_ALL = '__allVfcOS7';

/**
 * @event Client#request
 * @property {RequestEvent} event
 */
Client.EVENT_REQUEST = 'request';

/**
 * @event Client#beforeRequest
 * @property {RequestEvent} event
 */
Client.EVENT_BEFORE_REQUEST = 'beforeRequest';

/**
 * @event Client#message
 * @property {MessageEvent} event
 */
Client.EVENT_MESSAGE = 'message';

/**
 * @event Client#channel:
 * @property {ChannelEvent} event
 */
Client.EVENT_CHANNEL_NAME = 'channel:';

/**
 * @event Client#channel
 * @property {ChannelEvent} event
 */
Client.EVENT_CHANNEL = 'channel';

/**
 * @event Client#beforeSend
 * @property {MessageEvent} event
 */
Client.EVENT_BEFORE_SEND = 'beforeSend';

/**
 * @event Client#close
 * @property {Event} event
 */
Client.EVENT_CLOSE = 'close';

/**
 * @event Client#open
 * @property {Event} event
 */
Client.EVENT_OPEN = 'open';
module.exports = Client;