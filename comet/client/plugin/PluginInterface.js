/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../../../BaseJii');
const BaseObject = require('../../../base/BaseObject');

class PluginInterface extends BaseObject {

    preInit() {
        /**
         * @type {Jii.comet.client.Client}
         */
        this.comet = null;

        super.preInit(...arguments);
    }

}
module.exports = PluginInterface;