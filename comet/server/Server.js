/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../../BaseJii');
const TransportInterface = require('./transport/TransportInterface');
const _isEmpty = require('lodash/isEmpty');
const _values = require('lodash/values');
const _keys = require('lodash/keys');
const _each = require('lodash/each');
const HubServer = require('./HubServer');

class Server extends HubServer {

    preInit() {
        /**
         * @type {object}
         */
        this._subscribes = {};

        /**
         * @type {object}
         */
        this._connections = {};

        /**
         * @type {Server}
         */
        this._httpServer = null;

        /**
         * @type {TransportInterface}
         */
        this.transport = null;

        /**
         * @type {number}
         */
        this.port = 4100;

        /**
         * @type {string}
         */
        this.host = '0.0.0.0';

        super.preInit(...arguments);
    }

    init() {
        super.init();

        // Create http server
        this._httpServer = require('http').Server();

        // Init transport
        this.transport = Jii.createObject(this.transport);
        this.transport.on(TransportInterface.EVENT_ADD_CONNECTION, this._onAddConnection.bind(this));
        this.transport.on(TransportInterface.EVENT_REMOVE_CONNECTION, this._onRemoveConnection.bind(this));
        this.transport.on(TransportInterface.EVENT_MESSAGE, this._onClientMessage.bind(this));
        this.transport.on(TransportInterface.EVENT_LOG, this._onLog.bind(this));
        this.transport.bindEngine(this._httpServer);
    }

    /**
     * Start listen income comet connections
     */
    start() {
        return Promise.all([
            super.start(),
            new Promise(resolve => {
                this._httpServer.listen(this.port, this.host, () => {
                    resolve();
                });
            })
        ]);
    }

    /**
     * Abort current connections and stop listen income comet connections
     */
    stop() {
        return Promise.all([
            super.stop(),
            this.transport.destroy(_values(this._connections)),
            new Promise(resolve => {
                this._httpServer.close(() => {
                    resolve();
                });
            })
        ]);
    }

    /**
     *
     * @returns {{string: Connection}}
     */
    getConnections() {
        return this._connections;
    }

    /**
     *
     * @param {string[]} channel
     */
    getChannelConnectionUids(channel) {
        return _keys(this._subscribes[channel] || {});
    }

    /**
     * @param {string} connectionUid
     * @returns {string[]}
     */
    getConnectionChannels(connectionUid) {
        var channels = [];
        _each(this._subscribes, (connections, channel) => {
            if (connections[connectionUid]) {
                channels.push(channel);
            }
        });
        return channels;
    }

    /**
     * @param {String} connectionId
     * @param {String} channel
     */
    subscribe(connectionId, channel) {
        var connection = this._connections[connectionId];
        if (!connection) {
            return;
        }

        if (!this._subscribes[channel]) {
            this._subscribes[channel] = {};
        }
        if (!this.hasChannelHandlers(channel)) {
            this.hub.subscribe(channel);
        }
        this._subscribes[channel][connectionId] = true;
    }

    /**
     * @param {String} connectionId
     * @param {String} channel
     */
    unsubscribe(connectionId, channel) {
        // Delete connection
        if (this._subscribes[channel]) {
            delete this._subscribes[channel][connectionId];
        }

        // Delete subscribe, if no connections
        if (_isEmpty(this._subscribes[channel])) {
            delete this._subscribes[channel];
        }
        if (!this.hasChannelHandlers(channel)) {
            this.hub.unsubscribe(channel);
        }
    }

    /**
     *
     * @param {string} name
     * @returns {boolean}
     */
    hasChannelHandlers(name) {
        return super.hasChannelHandlers(name) || !_isEmpty(this._subscribes[name]);
    }

    /**
     * Send data to connection
     * @param {number|string} id
     * @param {*} message
     */
    sendToConnection(id, message) {
        if (typeof message !== 'string') {
            message = JSON.stringify(message);
        }

        var connection = this._connections[id];
        if (connection) {
            Jii.trace('Comet server send to connection `' + id + '` data: ' + message);
            this.transport.send(connection, message);
        } else {
            super.sendToConnection(id, message);
        }
    }

    /**
     * Store client connection
     * @param {ConnectionEvent} event
     * @private
     */
    _onAddConnection(event) {
        Jii.trace('User connected, connection id: `' + event.connection.id + '`');

        this._connections[event.connection.id] = event.connection;

        this.hub.subscribe(Server.CHANNEL_NAME_CONNECTION + event.connection.id);
        this.trigger(Server.EVENT_ADD_CONNECTION, event);
    }

    /**
     * Remove client connection from store
     * @param {ConnectionEvent} event
     * @private
     */
    _onRemoveConnection(event) {
        Jii.trace('User disconnected, connection id: `' + event.connection.id + '`');

        // Unsubscribe from all subscribed channels
        for (var channel in this._subscribes) {
            if (this._subscribes.hasOwnProperty(channel)) {
                this.unsubscribe(event.connection.id, channel);
            }
        }

        // Remove connection
        delete this._connections[event.connection.id];

        this.hub.unsubscribe(Server.CHANNEL_NAME_CONNECTION + event.connection.id);
        this.trigger(Server.EVENT_REMOVE_CONNECTION, event);
    }

    /**
     * Income messages from clients (browsers, ..)
     * @param {MessageEvent} event
     * @private
     */
    _onClientMessage(event) {
        if (event.message.indexOf('channel ') === 0) {
            var channelMessage = event.message.substr(8);
            var channel = channelMessage.split(' ', 1)[0];
            var message = channelMessage.substr(channel.length + 1);

            this.hub.send(channel, message);
            this.hub.send(Server.CHANNEL_NAME_ALL, channel + ' ' + message);
        }

        if (event.message.indexOf('action ') === 0) {
            var actionMessage = event.message.substr(7);
            var route = actionMessage.split(' ', 1)[0];
            var jsonString = actionMessage.substr(route.length + 1) || '{}';

            this.pushActionToQueue(event.connection, route, JSON.parse(jsonString));
        }

        if (event.message.indexOf('subscribe ') === 0) {
            this.subscribe(event.connection.id, event.message.substr(10));
        }
        if (event.message.indexOf('unsubscribe ') === 0) {
            this.unsubscribe(event.connection.id, event.message.substr(12));
        }
    }

    /**
     *
     * @param {LogEvent} event
     * @private
     */
    _onLog(event) {
        // @todo Jii.getLogger().log(message, Logger.LEVEL_TRACE, category);
        Jii.info(event.level + ': ' + event.message);
    }

    /**
     * Income message from hub
     * @param {ChannelEvent} event
     * @private
     */
    _onHubMessage(event) {
        if (event.channel.indexOf(Server.CHANNEL_NAME_CONNECTION) === 0) {
            var connectionId = event.channel.substr(Server.CHANNEL_NAME_CONNECTION.length);
            var connection = this._connections[connectionId];
            if (connection) {
                this.transport.send(connection, event.message);
            }
            return;
        }

        super._onHubMessage(event);

        if (this._subscribes[event.channel]) {
            for (var connectionId2 in this._subscribes[event.channel]) {
                if (this._subscribes[event.channel].hasOwnProperty(connectionId2)) {
                    this.sendToConnection(connectionId2, [
                        'channel',
                        event.channel,
                        event.message
                    ].join(' '));
                }
            }
        }
    }

}

/**
 * @event Server#removeConnection
 * @property {ConnectionEvent} event
 */
Server.EVENT_REMOVE_CONNECTION = 'removeConnection';

/**
 * @event Server#addConnection
 * @property {ConnectionEvent} event
 */
Server.EVENT_ADD_CONNECTION = 'addConnection';
module.exports = Server;