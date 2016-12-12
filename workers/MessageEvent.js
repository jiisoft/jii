/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

var Jii = require('../index');
var Event = require('../base/Event');
class MessageEvent extends Event {

    preInit() {
        /**
     * @type {string|object}
     */
        this.message = null;
        super.preInit(...arguments);
    }

}
module.exports = MessageEvent;