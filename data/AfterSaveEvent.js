/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var ModelEvent = require('../base/ModelEvent');

/**
 * @class Jii.data.AfterSaveEvent
 * @extends Jii.base.ModelEvent
 */
var AfterSaveEvent = Jii.defineClass('Jii.data.AfterSaveEvent', /** @lends Jii.data.AfterSaveEvent.prototype */{

	__extends: ModelEvent,

	/**
	 * The attribute values that had changed and were saved.
	 * @type {string[]}
	 */
	changedAttributes: null

});

module.exports = AfterSaveEvent;