/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Event = require('../base/Event');

class ValidateEvent extends Event {

    preInit() {
        this.errors = {};

        super.preInit(...arguments);
    }

}

module.exports = ValidateEvent;