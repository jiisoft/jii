
'use strict';

var Jii = require('../../../BaseJii');
var ChannelEvent = require('../../ChannelEvent');
var HubInterface = require('./HubInterface');

/**
 * @class Jii.comet.server.hub.Blank
 * @extends Jii.comet.server.hub.HubInterface
 */
var Blank = Jii.defineClass('Jii.comet.server.hub.Blank', /** @lends Jii.comet.server.hub.Blank.prototype */{

	__extends: HubInterface,

	_channels: {},

	/**
	 * Send message to channel
	 * @param {string} channel
	 * @param {string} message
	 */
	send(channel, message) {
		if (this._channels[channel]) {
			setTimeout(() => {
				this.trigger(this.__static.EVENT_MESSAGE, new ChannelEvent({
					channel: channel,
					message: message
				}));
			});
		}
	},

	/**
	 * Subscribe to channel
	 * @param {string} channel
	 */
	subscribe(channel) {
		this._channels[channel] = true;
	},

	/**
	 * Unsubscribe from channel
	 * @param {string} channel
	 */
	unsubscribe(channel) {
		delete this._channels[channel];
	}

});

module.exports = Blank;