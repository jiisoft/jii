
'use strict';

var Jii = require('../../../BaseJii');
var Client = require('../Client');
var TransportInterface = require('../transport/TransportInterface');
var PluginInterface = require('./PluginInterface');

/**
 * @class Jii.comet.client.plugin.AutoReconnect
 * @extends Jii.comet.client.plugin.PluginInterface
 */
var AutoReconnect = Jii.defineClass('Jii.comet.client.plugin.AutoReconnect', /** @lends Jii.comet.client.plugin.AutoReconnect.prototype */{

	__extends: PluginInterface,

	/**
	 * @type {boolean}
	 */
	enable: true,

	/**
	 * Minimal retry interval in milliseconds
	 * @type {number}
	 */
	minRetryInterval: 2000,

	/**
	 * Maximal retry interval in milliseconds
	 * @type {number}
	 */
	maxRetryInterval: 20000,

	/**
	 * @type {number}
	 */
	_tryReconnectNumber: 0,

	init() {
		this.comet.on(Client.EVENT_OPEN, this._onOpen.bind(this));
		this.comet.transport.on(TransportInterface.EVENT_CLOSE, this._onClose.bind(this));
	},

	_onOpen() {
		this._tryReconnectNumber = 0;
	},

	_onClose() {
		if (this.enable && !this.comet.isForceClosed()) {
			setTimeout(() => {
				this._tryReconnectNumber++;
				this.comet.open();
			}, this._tryReconnectNumber > 10 ? this.maxRetryInterval : this.minRetryInterval);
		}
	}

});

module.exports = AutoReconnect;