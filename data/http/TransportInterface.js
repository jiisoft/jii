/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var Component = require('../../base/Component');

class TransportInterface extends Component {

    /**
     * Send request to backend
     * @param {string} route
     * @param {object} [params]
     * @returns {Promise}
     */
    request(route, params) {
    }

}
module.exports = TransportInterface;