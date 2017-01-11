/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const ApplicationException = require('../exceptions/ApplicationException');

class SqlQueryException extends ApplicationException {

}

module.exports = SqlQueryException;