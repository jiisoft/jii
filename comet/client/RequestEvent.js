/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var Event = require('../../base/Event');

/**
 * @class Jii.comet.client.RequestEvent
 * @extends Jii.base.Event
 */
var RequestEvent = Jii.defineClass('Jii.comet.client.RequestEvent', /** @lends Jii.comet.client.RequestEvent.prototype */{

	__extends: Event,

	/**
	 * @type {string}
	 */
    route: null

});

module.exports = RequestEvent;