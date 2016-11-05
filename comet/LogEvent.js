/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Event = require('../base/Event');

/**
 * @class Jii.comet.LogEvent
 * @extends Jii.base.Event
 */
var LogEvent = Jii.defineClass('Jii.comet.LogEvent', /** @lends Jii.comet.LogEvent.prototype */{

	__extends: Event,

	/**
	 * Level: debug/info/warning/error
	 * @type {string}
	 */
	level: null,

	/**
	 * Log message
	 * @type {string}
	 */
	message: null

});

module.exports = LogEvent;