/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../../BaseJii');
var QueueInterface = require('./QueueInterface');

class Redis extends QueueInterface {

    preInit() {
        /**
         * @type {RedisClient}
         */
        this._engine = null;
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

    init() {
    }

    start() {
        var options = {};
        if (this.password !== null) {
            options.auth_pass = this.password;
        }

        this._engine = require('redis').createClient(this.port, this.host, options);
        return new Promise(resolve => {
            if (this._engine.connected) {
                resolve();
                return;
            }

            var onConnect = () => {
                this._engine.removeListener('connect', onConnect);
                resolve();
            };
            this._engine.on('connect', onConnect);
        });
    }

    /**
     * Stop queue
     */
    stop() {
        return new Promise(resolve => {
            var onClose = () => {
                this._engine.removeListener('close', onClose);
                resolve();
            };
            this._engine.on('close', onClose);
            this._engine.end();
        });
    }

    /**
     * Add message to queue
     * @param {string} message
     */
    push(message) {
        return new Promise((resolve, reject) => {
            this._engine.rpush(Redis.KEY, message, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Get and remove message from queue
     * @returns Promise
     */
    pop() {
        return new Promise((resolve, reject) => {
            this._engine.lpop(Redis.KEY, (err, message) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(message || null);
                }
            });
        });
    }

}

/**
 * @type {string}
 */
Redis.KEY = '__queueZCw4l7';
module.exports = Redis;