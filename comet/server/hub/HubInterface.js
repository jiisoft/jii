
'use strict';

var Jii = require('../../../BaseJii');
var Component = require('../../../base/Component');

/**
 * @class Jii.comet.server.hub.HubInterface
 * @extends Jii.base.Component
 */
var HubInterface = Jii.defineClass('Jii.comet.server.hub.HubInterface', /** @lends Jii.comet.server.hub.HubInterface.prototype */{

	__extends: Component,

	__static: /** @lends Jii.comet.server.hub.HubInterface */{

		/**
		 * @event Jii.comet.server.hub.HubInterface#message
		 * @property {Jii.comet.ChannelEvent} event
		 */
		EVENT_MESSAGE: 'message'

	},

	/**
	 * Start hub
	 */
	start() {

	},

	/**
	 * Stop hub
	 */
	stop() {

	},

	/**
	 * Send message to channel
	 * @param {string} channel
	 * @param {string} message
	 */
	send(channel, message) {

	},

	/**
	 * Subscribe to channel
	 * @param {string} channel
	 */
	subscribe(channel) {

	},

	/**
	 * Unsubscribe from channel
	 * @param {string} channel
	 */
	unsubscribe(channel) {

	}


});

module.exports = HubInterface;