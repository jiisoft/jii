/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Event = require('../base/Event');

/**
 * @class Jii.data.CollectionEvent
 * @extends Jii.base.Event
 */
var CollectionEvent = Jii.defineClass('Jii.data.CollectionEvent', /** @lends Jii.data.CollectionEvent.prototype */{

	__extends: Event,

    /**
     *
     * @type {Jii.base.Model[]}
     */
    added: [],

    /**
     *
     * @type {Jii.base.Model[]}
     */
    removed: [],

    /**
     * @type {boolean}
     */
    isFetch: false,

    /**
     *
     * @type {boolean}
     */
    isSorted: false

});

module.exports = CollectionEvent;