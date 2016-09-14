/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../Jii');
var ApplicationException = require('./ApplicationException');

/**
 * @class Jii.exceptions.UnknownPropertyException
 * @extends Jii.exceptions.ApplicationException
 */
module.exports = Jii.defineClass('Jii.exceptions.UnknownPropertyException', /** @lends Jii.exceptions.UnknownPropertyException.prototype */{

	__extends: ApplicationException

});
