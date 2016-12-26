/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Event = require('../base/Event');

class ChangeEvent extends Event {

    preInit() {
        this.changedAttributes = {};

        super.preInit(...arguments);
    }

}
module.exports = ChangeEvent;