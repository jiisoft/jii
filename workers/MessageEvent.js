/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../index');
var Event = require('../base/Event');

/**
 * @class Jii.workers.MessageEvent
 * @extends Jii.base.Event
 */
var MessageEvent = Jii.defineClass('Jii.workers.MessageEvent', /** @lends Jii.workers.MessageEvent.prototype */{

	__extends: Event,

	/**
	 * @type {string|object}
	 */
	message: null

});

module.exports = MessageEvent;