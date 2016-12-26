/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../index');
var BaseResponse = require('../base/Response');

class Response extends BaseResponse {

    preInit() {
        /**
         * @type {function}
         */
        this.handler = null;

        super.preInit(...arguments);
    }

    /**
     *
     * @param {*} [data]
     */
    send(data) {
        data = data || this.data;
        this.handler.call(null, data);
    }

}
module.exports = Response;