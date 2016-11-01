/**
 *
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var BaseResponse = require('../../base/Response');

/**
 * @class Jii.request.client.Response
 * @extends Jii.base.Response
 */
var Response = Jii.defineClass('Jii.request.client.Response', /** @lends Jii.request.client.Response.prototype */{

	__extends: BaseResponse


});

module.exports = Response;