/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var HttpRequest = require('../../base/HttpRequest');

class Request extends HttpRequest {

    preInit() {
        /**
         * @type {string}
         */
        this.ip = null;

        /**
         * @type {string}
         */
        this.uid = null;

        super.preInit(...arguments);
    }

    toJSON() {
        return {
            ip: this.ip,
            port: this.getPort(),
            params: this.getQueryParams(),
            headers: this.getHeaders().toJSON()
        };
    }

}
module.exports = Request;