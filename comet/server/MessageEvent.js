/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var ConnectionEvent = require('./ConnectionEvent');

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