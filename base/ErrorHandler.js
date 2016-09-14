/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../Jii');
var Component = require('./Component');

/**
 * @class Jii.base.ErrorHandler
 * @extends Jii.base.Component
 */
module.exports = Jii.defineClass('Jii.base.ErrorHandler', /** @lends Jii.base.ErrorHandler.prototype */{

	__extends: Component,

    /**
     * @type {*}
     */
    error: null

});
