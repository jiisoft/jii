'use strict';

var Jii = require('../../../BaseJii');
var Component = require('../../../base/Component');

/**
 * @class Jii.comet.server.queue.QueueInterface
 * @extends Jii.base.Component
 */
var QueueInterface = Jii.defineClass('Jii.comet.server.queue.QueueInterface', /** @lends Jii.comet.server.queue.QueueInterface.prototype */{

	__extends: Component,

	/**
	 * Start queue
	 */
	start() {

	},

	/**
	 * Stop queue
	 */
	stop() {

	},

	/**
	 * Add message to queue
	 * @param message
	 */
	push(message) {
	},

	/**
	 * Get and remove message from queue
	 * @returns Promise
	 */
	pop() {
	}

});

module.exports = QueueInterface;