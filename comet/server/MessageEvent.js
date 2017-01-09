/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../../BaseJii');
const ConnectionEvent = require('./ConnectionEvent');

class MessageEvent extends ConnectionEvent {

    preInit() {
        /**
         * @type {object}
         */
        this.message = null;

        super.preInit(...arguments);
    }

}
module.exports = MessageEvent;