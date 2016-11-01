/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Event = require('../base/Event');

/**
 * @class Jii.data.FetchEvent
 * @extends Jii.base.Event
 */
var FetchEvent = Jii.defineClass('Jii.data.FetchEvent', /** @lends Jii.data.FetchEvent.prototype */{

	__extends: Event,

    /**
     * @type {boolean}
     */
    isLoading: false

});

module.exports = FetchEvent;