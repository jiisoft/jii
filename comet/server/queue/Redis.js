'use strict';

var Jii = require('../../../BaseJii');
var QueueInterface = require('./QueueInterface');

/**
 * @class Jii.comet.server.queue.Redis
 * @extends Jii.comet.server.queue.QueueInterface
 */
var Redis = Jii.defineClass('Jii.comet.server.queue.Redis', /** @lends Jii.comet.server.queue.Redis.prototype */{

	__extends: QueueInterface,

	__static: /** @lends Jii.comet.queue.Redis */{

		/**
		 * @type {string}
		 */
		KEY: '__queueZCw4l7'

	},

	/**
	 * @type {string}
	 */
	host: '127.0.0.1',

	/**
	 * @type {number}
	 */
	port: 6379,

	/**
	 * @type {string}
	 */
	password: null,

	/**
	 * @type {RedisClient}
	 */
	_engine: null,

	init() {
	},

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
			this._engine.on('connect', onConnect)
		});
	},

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
	},

	/**
	 * Add message to queue
	 * @param {string} message
	 */
	push(message) {
		return new Promise((resolve, reject) => {
			this._engine.rpush(this.__static.KEY, message, err => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	},

	/**
	 * Get and remove message from queue
	 * @returns Promise
	 */
	pop() {
		return new Promise((resolve, reject) => {
			this._engine.lpop(this.__static.KEY, (err, message) => {
				if (err) {
					reject(err);
				} else {
					resolve(message || null);
				}
			});
		});
	}

});

module.exports = Redis;