/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('../Jii');

require('./ApplicationException');

/**
 * @class Jii.exceptions.InvalidParamException
 * @extends Jii.exceptions.ApplicationException
 */
Jii.defineClass('Jii.exceptions.InvalidParamException', /** @lends Jii.exceptions.InvalidParamException.prototype */{

	__extends: Jii.exceptions.ApplicationException

});
