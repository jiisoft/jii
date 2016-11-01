/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var CollectionEvent = require('./CollectionEvent');

/**
 * @class Jii.data.DataProviderEvent
 * @extends Jii.data.CollectionEvent
 */
var DataProviderEvent = Jii.defineClass('Jii.data.DataProviderEvent', /** @lends Jii.data.DataProviderEvent.prototype */{

	__extends: CollectionEvent,

    /**
     * @type {number|null}
     */
    totalCount: null

});

module.exports = DataProviderEvent;