/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Event = require('../base/Event');

/**
 * @class Jii.comet.ChannelEvent
 * @extends Jii.base.Event
 */
var ChannelEvent = Jii.defineClass('Jii.comet.ChannelEvent', /** @lends Jii.comet.ChannelEvent.prototype */{

	__extends: Event,

	/**
	 * @type {string}
	 */
	channel: null,

	/**
	 * @type {string}
	 */
	message: null

});

module.exports = ChannelEvent;