/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

var Jii = require('../../BaseJii');
var Event = require('../../base/Event');

class ConnectionEvent extends Event {

    preInit() {
        /**
         * @type {Jii.comet.server.Connection}
         */
        this.connection = null;

        super.preInit(...arguments);
    }

}
module.exports = ConnectionEvent;