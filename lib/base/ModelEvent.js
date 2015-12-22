/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('../Jii');

require('./Event');

/**
 * @class Jii.base.ModelEvent
 * @extends Jii.base.Event
 */
Jii.defineClass('Jii.base.ModelEvent', /** @lends Jii.base.ModelEvent.prototype */{

	__extends: 'Jii.base.Event',

	/**
	 * A model is in valid status if it passes validations or certain checks.
	 * @type {boolean} Whether the model is in valid status. Defaults to true.
	 */
	isValid: true

});
