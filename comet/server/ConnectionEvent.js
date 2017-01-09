/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

const Jii = require('../../BaseJii');
const Event = require('../../base/Event');

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