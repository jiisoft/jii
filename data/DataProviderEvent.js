/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var CollectionEvent = require('./CollectionEvent');

class DataProviderEvent extends CollectionEvent {

    preInit() {
        /**
         * @type {number|null}
         */
        this.totalCount = null;

        super.preInit(...arguments);
    }

}
module.exports = DataProviderEvent;