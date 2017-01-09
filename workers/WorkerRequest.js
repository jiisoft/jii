/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../index');
const BaseRequest = require('../base/Request');

class WorkerRequest extends BaseRequest {

    preInit() {
        /**
         * @type {string}
         */
        this.uid = null;

        super.preInit(...arguments);
    }

}
module.exports = WorkerRequest;