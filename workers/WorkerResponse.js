/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../index');
const BaseResponse = require('../base/Response');

class WorkerResponse extends BaseResponse {

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
module.exports = WorkerResponse;