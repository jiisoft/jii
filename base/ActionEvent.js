/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const Event = require('./Event');

class ActionEvent extends Event {

    preInit() {
        /**
         * @type {Jii.base.Context}
         */
        this.context = null;

        /**
         * @type {Jii.base.Action}
         */
        this.action = null;

        super.preInit(...arguments);
    }

}
module.exports = ActionEvent;