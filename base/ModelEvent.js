/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Event = require('./Event');

/**
 * @class Jii.base.ModelEvent
 * @extends Jii.base.Event
 */
module.exports = Jii.defineClass('Jii.base.ModelEvent', /** @lends Jii.base.ModelEvent.prototype */{

	__extends: Event,

	/**
	 * A model is in valid status if it passes validations or certain checks.
	 * @type {boolean} Whether the model is in valid status. Defaults to true.
	 */
	isValid: true

});
