/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const ApplicationException = require('./ApplicationException');

class UnknownPropertyException extends ApplicationException {

}

module.exports = UnknownPropertyException;