/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../../BaseJii');
const Event = require('../../base/Event');

class MessageEvent extends Event {

    preInit() {
        /**
         * @type {string}
         */
        this.message = null;

        super.preInit(...arguments);
    }

}
module.exports = MessageEvent;