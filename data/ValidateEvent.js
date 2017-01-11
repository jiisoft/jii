/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const Event = require('../base/Event');

class ValidateEvent extends Event {

    preInit() {
        this.errors = {};

        super.preInit(...arguments);
    }

}

module.exports = ValidateEvent;