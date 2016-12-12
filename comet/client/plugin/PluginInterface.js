'use strict';

var Jii = require('../../../BaseJii');
var Object = require('../../../base/Object');
class PluginInterface extends Object {

    preInit() {
        /**
     * @type {Jii.comet.client.Client}
     */
        this.comet = null;
        super.preInit(...arguments);
    }

}
module.exports = PluginInterface;