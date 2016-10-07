/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var ApplicationException = require('./ApplicationException');

/**
 * @class Jii.exceptions.InvalidParamException
 * @extends Jii.exceptions.ApplicationException
 */
var InvalidParamException = Jii.defineClass('Jii.exceptions.InvalidParamException', /** @lends Jii.exceptions.InvalidParamException.prototype */{

	__extends: ApplicationException

});

module.exports = InvalidParamException;