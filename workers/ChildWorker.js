/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('jii');
var String = require('jii/helpers/String');
var InvalidConfigException = require('jii/exceptions/InvalidConfigException');
var MessageEvent = require('./MessageEvent');
var _isFunction = require('lodash/isFunction');
var _isArray = require('lodash/isArray');
var _has = require('lodash/has');
var Component = require('jii/base/Component');
var cluster = require('cluster');

/**
 * @class Jii.workers.ChildWorker
 * @extends Jii.base.Component
 */
var ChildWorker = Jii.defineClass('Jii.workers.ChildWorker', /** @lends Jii.workers.ChildWorker.prototype */{

    __extends: Component,

    __static: /** @lends Jii.workers.ChildWorker */{

        /**
         * @event Jii.workers.ChildWorker#message
         * @property {Jii.workers.MessageEvent} event
         */
        EVENT_MESSAGE: 'message'

    },

    /**
     * @type {string}
     */
    name: null,

    /**
     * @type {number|null}
     */
    _index: null,

    /**
     * @type {object|null}
     */
    _config: null,

    /**
     * @type {object}
     */
    _actionHandlers: {},

    /**
     * @type {object}
     */
    _actionResponses: {},

    /**
     * @type {number}
     */
    stopTimeout: 10, // sec

    init() {
        process.on('uncaughtException', err => {
            console.error('Caught exception:', err, err.stack);

            // Normal stop services
            this.stop();
        });

        this._onMessage = this._onMessage.bind(this);
    },

    /**
     *
     */
    start() {
        // Check already started
        if (Jii.app) {
            return;
        }

        // Publish current component to application
        this._config.application = this._config.application || {};
        this._config.application.components = this._config.application.components || {};
        if (this._config.application.components.worker && this._config.application.components.worker !== this) {
            Jii.configure(this, this._config.application.components.worker);
        }

        Jii.createWebApplication(this._config);
        Jii.app.setComponent('worker', this);

        process.on('message', this._onMessage);

        Jii.app.start();
    },

    /**
     *
     */
    stop() {
        console.info('Worker `%s` thread stopped...', this.name);

        // Check do not start
        if (!Jii.app) {
            return;
        }

        // Stop application
        Jii.app.stop().then(() => {
            require('cluster').worker.disconnect();
        });

        process.off('message', this._onMessage);

        // Timeout for stop application. Don't wait timeout - call unref()
        if (this.stopTimeout > 0) {
            setTimeout(this._killSelf.bind(this), this.stopTimeout * 1000).unref();
        }
    },

    /**
     * Send message to workers
     * @param {string|object} message
     */
    send(message) {
        process.send({
            message: message
        });
    },

    /**
     * Run action on all workers
     * @param {string} route
     * @param {object} [params]
     */
    action(route, params) {
        params = params || {};

        var requestUid = String.generateUid();
        return new Promise(resolve => {
            this._actionHandlers[requestUid] = resolve;
            this._actionResponses[requestUid] = [];
            process.send({
                requestUid: requestUid,
                senderIndex: this._index,
                route: route,
                params: params
            });
        });
    },

    /**
     * @returns {number}
     */
    getIndex() {
        return this._index;
    },

    /**
     *
     * @param {number} value
     */
    setIndex(value) {
        if (this._index !== null) {
            throw new InvalidConfigException('You cannot change worker index.');
        }
        this._index = parseInt(value);
    },

    /**
     *
     * @param {object} value
     */
    setConfig(value) {
        if (this._config !== null) {
            throw new InvalidConfigException('You cannot change worker config.');
        }
        this._config = value;
    },

    _onMessage(data) {
        if (_has(data, 'message')) {
            this.trigger(this.__static.EVENT_MESSAGE, new MessageEvent({
                message: data.message
            }));
        } else if (_has(data, 'route') && _has(data, 'senderIndex') && _has(data, 'requestUid')) {
            Jii.app.runAction(data.route, Jii.createContext({
                route: data.route,
                components: {
                    request: {
                        className: 'Jii.workers.Request',
                        uid: data.requestUid,
                        params: data.params || {}
                    },
                    response: {
                        className: 'Jii.workers.Response',
                        handler(result) {
                            process.send({
                                requestUid: data.requestUid,
                                response: result,
                                filter: {
                                    index: data.senderIndex
                                }
                            })
                        }
                    }
                }
            }));
        } else if (_has(data, 'response')
            && _has(data, 'requestUid')
            && _isFunction(this._actionHandlers[data.requestUid])
            && _isArray(this._actionResponses[data.requestUid])) {

            this._actionResponses[data.requestUid].push(data.response);

            if (data.workersCount === this._actionResponses[data.requestUid].length) {
                this._actionHandlers[data.requestUid].call(null, this._actionResponses[data.requestUid]);
            }
        }
    },

    _killSelf() {
        console.info('Force exit `%s` worker...', process.env.APPLICATION_NAME);
        process.exit();
    }

});

module.exports = ChildWorker;