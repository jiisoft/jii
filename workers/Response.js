/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../index');
var BaseResponse = require('../base/Response');

/**
 * @class Jii.workers.Response
 * @extends Jii.base.Response
 */
var Response = Jii.defineClass('Jii.workers.Response', /** @lends Jii.workers.Response.prototype */{

	__extends: BaseResponse,

	/**
	 * @type {function}
	 */
	handler: null,

	/**
	 *
	 * @param {*} [data]
	 */
	send(data) {
		data = data || this.data;
		this.handler.call(null, data);
	}

});

module.exports = Response;
