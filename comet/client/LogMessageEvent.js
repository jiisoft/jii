/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../../BaseJii');
const Event = require('../../base/Event');

class LogMessageEvent extends Event {

    preInit() {
        /**
         * Log message
         * @type {string}
         */
        this.message = null;

        /**
         *  Level: debug/info/warning/error
         * @type {string}
         */
        this.level = null;

        super.preInit(...arguments);
    }

}
module.exports = LogMessageEvent;