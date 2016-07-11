/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('../Jii');

/**
 * @class Jii.base.ErrorHandler
 * @extends Jii.base.Component
 */
Jii.defineClass('Jii.base.ErrorHandler', /** @lends Jii.base.ErrorHandler.prototype */{

	__extends: 'Jii.base.Component',

    /**
     * @type {*}
     */
    error: null

});
