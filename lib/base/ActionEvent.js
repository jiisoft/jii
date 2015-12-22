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
 * @class Jii.base.ActionEvent
 * @extends Jii.base.Event
 */
Jii.defineClass('Jii.base.ActionEvent', /** @lends Jii.base.ActionEvent.prototype */{

	__extends: 'Jii.base.Event',

	/**
	 * @type {Jii.base.Action}
	 */
	action: null,

	/**
	 * @type {Jii.base.Context}
	 */
	context: null

});
