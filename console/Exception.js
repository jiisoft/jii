/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../index');
var ApplicationException = require('../exceptions/ApplicationException');

/**
 * @class Jii.console.Exception
 * @extends Jii.exceptions.ApplicationException
 */
var Exception = Jii.defineClass('Jii.console.Exception', /** @lends Jii.console.Exception.prototype */{

	__extends: ApplicationException

});

module.exports = Exception;