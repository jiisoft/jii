/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const ModelEvent = require('../base/ModelEvent');

class AfterSaveEvent extends ModelEvent {

    preInit() {
        /**
         * The attribute values that had changed and were saved.
         * @type {string[]}
         */
        this.changedAttributes = null;

        super.preInit(...arguments);
    }

}
module.exports = AfterSaveEvent;