/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var ApplicationException = require('../exceptions/ApplicationException');

/**
 * @class Jii.data.SqlQueryException
 * @extends Jii.exceptions.ApplicationException
 */
var SqlQueryException = Jii.defineClass('Jii.data.SqlQueryException', /** @lends Jii.data.SqlQueryException.prototype */{

	__extends: ApplicationException

});

module.exports = SqlQueryException;