/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Event = require('./Event');

/**
 * @class Jii.base.ActionEvent
 * @extends Jii.base.Event
 */
var ActionEvent = Jii.defineClass('Jii.base.ActionEvent', /** @lends Jii.base.ActionEvent.prototype */{

	__extends: Event,

	/**
	 * @type {Jii.base.Action}
	 */
	action: null,

	/**
	 * @type {Jii.base.Context}
	 */
	context: null

});

module.exports = ActionEvent;