/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var Event = require('../../base/Event');

/**
 * @class Jii.comet.client.LogMessageEvent
 * @extends Jii.base.Event
 */
var LogMessageEvent = Jii.defineClass('Jii.comet.client.LogMessageEvent', /** @lends Jii.comet.client.LogMessageEvent.prototype */{

	__extends: Event,

	/**
	 *  Level: debug/info/warning/error
	 * @type {string}
	 */
	level: null,

	/**
	 * Log message
	 * @type {string}
	 */
	message: null

});

module.exports = LogMessageEvent;