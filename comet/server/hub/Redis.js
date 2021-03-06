/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../../../BaseJii');
const ChannelEvent = require('../../ChannelEvent');
const HubInterface = require('./HubInterface');

class Redis extends HubInterface {

    preInit() {
        /**
         * @type {RedisClient}
         */
        this._subscriber = null;

        /**
         * @type {RedisClient}
         */
        this._hub = null;

        /**
         * @type {string}
         */
        this.password = null;

        /**
         * @type {number}
         */
        this.port = 6379;

        /**
         * @type {string}
         */
        this.host = '127.0.0.1';

        super.preInit(...arguments);
    }

    /**
     * Start hub
     */
    start() {
        var options = {};
        if (this.password !== null) {
            options.auth_pass = this.password;
        }

        const redis = require('redis');
        this._hub = redis.createClient(this.port, this.host, options);
        this._subscriber = redis.createClient(this.port, this.host, options);

        return Promise.all([
            // connect hub
            new Promise(resolve => {
                if (this._hub.connected) {
                    resolve();
                    return;
                }

                var onConnect = () => {
                    this._hub.removeListener('connect', onConnect);
                    resolve();
                };
                this._hub.on('connect', onConnect);
            }),

            // connect subscriber
            new Promise(resolve => {
                if (this._subscriber.connected) {
                    resolve();
                    return;
                }

                var onConnect = () => {
                    this._subscriber.removeListener('connect', onConnect);
                    resolve();
                };
                this._subscriber.on('connect', onConnect);
            })
        ]).then(() => {

            // do subscribe
            this._subscriber.on('message', this._onHubMessage.bind(this));
        });
    }

    /**
     * End hub
     */
    stop() {
        return Promise.all([
            new Promise(resolve => {
                var onClose = () => {
                    this._hub.removeListener('close', onClose);
                    resolve();
                };
                this._hub.on('close', onClose);
                this._hub.end();
            }),
            new Promise(resolve => {
                var onClose = () => {
                    this._subscriber.removeListener('close', onClose);
                    resolve();
                };
                this._subscriber.on('close', onClose);
                this._subscriber.end();
            })
        ]);
    }

    /**
     * Send message to channel
     * @param {string} channel
     * @param {string} message
     */
    send(channel, message) {
        this._hub.publish(channel, message);
    }

    /**
     * Subscribe to channel
     * @param {string} channel
     */
    subscribe(channel) {
        this._subscriber.subscribe(channel);
    }

    /**
     * Unsubscribe from channel
     * @param {string} channel
     */
    unsubscribe(channel) {
        this._subscriber.unsubscribe(channel);
    }

    _onHubMessage(channel, message) {
        this.trigger(Redis.EVENT_MESSAGE, new ChannelEvent({
            channel: channel,
            message: message
        }));
    }

}
module.exports = Redis;