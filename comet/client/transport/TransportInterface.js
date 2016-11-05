
'use strict';

var Jii = require('jii');
var Component = require('jii/base/Component');

/**
 * @class Jii.comet.client.transport.TransportInterface
 * @extends Jii.base.Component
 */
var TransportInterface = Jii.defineClass('Jii.comet.client.transport.TransportInterface', /** @lends Jii.comet.client.transport.TransportInterface.prototype */{

	__extends: Component,

	__static: /** @lends Jii.comet.client.transport.TransportInterface */{

		/**
		 * @event Jii.comet.client.transport.TransportInterface#open
		 * @property {Jii.base.Event} event
		 */
		EVENT_OPEN: 'open',

		/**
		 * @event Jii.comet.client.transport.TransportInterface#close
		 * @property {Jii.base.Event} event
		 */
		EVENT_CLOSE: 'close',

		/**
		 * @event Jii.comet.client.transport.TransportInterface#message
		 * @property {Jii.comet.client.MessageEvent} event
		 */
		EVENT_MESSAGE: 'message',

		/**
		 * @event Jii.comet.client.transport.TransportInterface#log
		 * @property {Jii.comet.client.LogMessageEvent} event
		 */
		EVENT_LOG: 'log'

	},

	/**
	 * Open connection
	 * @param {string} url
	 */
	open(url) {
	},

	/**
	 * Close connection
	 */
	close() {
	},

	/**
	 * Send message to server
	 * @param {string} message
	 */
	send(message) {
	}

});

module.exports = TransportInterface;