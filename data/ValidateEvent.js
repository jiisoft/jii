/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Event = require('../base/Event');

/**
 * @class Jii.data.ValidateEvent
 * @extends Jii.base.Event
 */
var ValidateEvent = Jii.defineClass('Jii.data.ValidateEvent', /** @lends Jii.data.ValidateEvent.prototype */{

	__extends: Event,

    errors: {}

});

module.exports = ValidateEvent;