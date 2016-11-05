/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var HttpRequest = require('../../base/HttpRequest');

/**
 * @class Jii.comet.server.Request
 * @extends Jii.base.HttpRequest
 */
var Request = Jii.defineClass('Jii.comet.server.Request', /** @lends Jii.comet.server.Request.prototype */{

	__extends: HttpRequest,

    /**
     * @type {string}
     */
    uid: null,

	/**
	 * @type {string}
	 */
	ip: null,

	toJSON() {
        return {
            ip: this.ip,
            port: this.getPort(),
            params: this.getQueryParams(),
            headers: this.getHeaders().toJSON()
        };
	}

});

module.exports = Request;