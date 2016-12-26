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
         * The status 0 means the program terminates successfully.
         * @type {number} the exit status. Exit statuses should be in the range 0 to 254.
         */
        this.exitStatus = 0;

        super.preInit(...arguments);
    }

}
module.exports = Response;