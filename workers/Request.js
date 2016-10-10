/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('jii');
var BaseRequest = require('jii/base/Request');

/**
 * @class Jii.workers.Request
 * @extends Jii.base.Request
 */
var Request = Jii.defineClass('Jii.workers.Request', /** @lends Jii.workers.Request.prototype */{

	__extends: BaseRequest,

    /**
     * @type {string}
     */
    uid: null

});

module.exports = Request;