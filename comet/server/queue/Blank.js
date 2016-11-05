'use strict';

var Jii = require('../../../BaseJii');
var QueueInterface = require('./QueueInterface');

/**
 * @class Jii.comet.server.queue.Blank
 * @extends Jii.comet.server.queue.QueueInterface
 */
var Blank = Jii.defineClass('Jii.comet.server.queue.Blank', /** @lends Jii.comet.server.queue.Blank.prototype */{

	__extends: QueueInterface,

	_queue: [],

	/**
	 * Add message to queue
	 * @param {string} message
	 */
	push(message) {
		return new Promise(resolve => {
			this._queue.push(message);
			setTimeout(() => resolve());
		});
	},

	/**
	 * Get and remove message from queue
	 * @returns Promise
	 */
	pop() {
		return new Promise(resolve => {
			const message = this._queue.shift() || null;
			setTimeout(() => resolve(message));
		});
	}

});

module.exports = Blank;