/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Event = require('./Event');

class ModelEvent extends Event {

    preInit() {
        /**
         * A model is in valid status if it passes validations or certain checks.
         * @type {boolean} Whether the model is in valid status. Defaults to true.
         */
        this.isValid = true;

        super.preInit(...arguments);
    }

}
module.exports = ModelEvent;