/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var Event = require('../../base/Event');

/**
 * @class Jii.comet.client.MessageEvent
 * @extends Jii.base.Event
 */
var MessageEvent = Jii.defineClass('Jii.comet.client.MessageEvent', /** @lends Jii.comet.client.MessageEvent.prototype */{

	__extends: Event,

	/**
	 * @type {string}
	 */
	message: null

});

module.exports = MessageEvent;