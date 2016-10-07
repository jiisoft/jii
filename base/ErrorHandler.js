/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Component = require('./Component');

/**
 * @class Jii.base.ErrorHandler
 * @extends Jii.base.Component
 */
var ErrorHandler = Jii.defineClass('Jii.base.ErrorHandler', /** @lends Jii.base.ErrorHandler.prototype */{

	__extends: Component,

    /**
     * @type {*}
     */
    error: null

});

module.exports = ErrorHandler;