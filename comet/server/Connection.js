/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

var Jii = require('../../BaseJii');
var _pick = require('lodash/pick');
var Component = require('../../base/Component');
class Connection extends Component {

    preInit() {
        /**
     * @type {object}
     */
        this.originalConnection = null;
        /**
     * @type {Jii.comet.server.Request}
     */
        this.request = null;
        /**
     * Connection id
     * @type {number|string}
     */
        this.id = null;
        super.preInit(...arguments);
    }

    toJSON() {
        return _pick(this, ['id']);
    }

}
module.exports = Connection;