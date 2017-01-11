/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const Event = require('../base/Event');

class ChannelEvent extends Event {

    preInit() {
        /**
         * @type {string}
         */
        this.message = null;

        /**
         * @type {string}
         */
        this.channel = null;

        super.preInit(...arguments);
    }

}
module.exports = ChannelEvent;