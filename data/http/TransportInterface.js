/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../../BaseJii');
const Component = require('../../base/Component');

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