/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var Event = require('../../base/Event');

/**
 * @class Jii.comet.server.ConnectionEvent
 * @extends Jii.base.Event
 */
var ConnectionEvent = Jii.defineClass('Jii.comet.server.ConnectionEvent', /** @lends Jii.comet.server.ConnectionEvent.prototype */{

	__extends: Event,

	/**
	 * @type {Jii.comet.server.Connection}
	 */
	connection: null

});

module.exports = ConnectionEvent;