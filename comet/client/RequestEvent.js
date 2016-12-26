/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var Event = require('../../base/Event');

class RequestEvent extends Event {

    preInit() {
        /**
         * @type {string}
         */
        this.route = null;

        super.preInit(...arguments);
    }

}
module.exports = RequestEvent;