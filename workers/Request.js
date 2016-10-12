/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../index');
var BaseRequest = require('../base/Request');

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