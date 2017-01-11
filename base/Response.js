/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const Component = require('./Component');

class Response extends Component {

    preInit() {
        /**
         * The original response data
         * @type {*}
         */
        this.data = null;

        /**
         * @var {boolean} whether the response has been sent. If this is true, calling [[send()]] will do nothing.
         */
        this.isSent = false;

        super.preInit(...arguments);
    }

    /**
     * Sends the response to client.
     */
    send() {
    }

}
module.exports = Response;