/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Event = require('../base/Event');

/**
 * @class Jii.data.ChangeEvent
 * @extends Jii.base.Event
 */
var ChangeEvent = Jii.defineClass('Jii.data.ChangeEvent', /** @lends Jii.data.ChangeEvent.prototype */{

	__extends: Event,

    changedAttributes: {}

});

module.exports = ChangeEvent;