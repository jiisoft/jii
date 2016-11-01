/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var ChangeEvent = require('./ChangeEvent');

/**
 * @class Jii.data.ChangeAttributeEvent
 * @extends Jii.data.ChangeEvent
 */
var ChangeAttributeEvent = Jii.defineClass('Jii.data.ChangeAttributeEvent', /** @lends Jii.data.ChangeAttributeEvent.prototype */{

	__extends: ChangeEvent,

    /**
     * @type {string}
     */
    attribute: '',

    /**
     * @type {*}
     */
    oldValue: null,

    /**
     * @type {*}
     */
    newValue: null,

    /**
     * @type {boolean}
     */
    isRelation: false

});

module.exports = ChangeAttributeEvent;