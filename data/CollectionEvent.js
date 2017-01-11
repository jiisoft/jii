/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const Event = require('../base/Event');

class CollectionEvent extends Event {

    preInit() {
        /**
         *
         * @type {boolean}
         */
        this.isSorted = false;

        /**
         * @type {boolean}
         */
        this.isFetch = false;

        /**
         *
         * @type {Model[]}
         */
        this.removed = [];

        /**
         *
         * @type {Model[]}
         */
        this.added = [];

        super.preInit(...arguments);
    }

}
module.exports = CollectionEvent;