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
 * @class Jii.exceptions.UnknownPropertyException
 * @extends Jii.exceptions.ApplicationException
 */
Jii.defineClass('Jii.exceptions.UnknownPropertyException', /** @lends Jii.exceptions.UnknownPropertyException.prototype */{

	__extends: Jii.exceptions.ApplicationException

});
