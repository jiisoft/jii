/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

const Jii = require('../../BaseJii');
const _pick = require('lodash/pick');
const Component = require('../../base/Component');

class Connection extends Component {

    preInit() {
        /**
         * @type {object}
         */
        this.originalConnection = null;

        /**
         * @type {Request}
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