/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const ApplicationException = require('./ApplicationException');

class NotSupportedException extends ApplicationException {

}

module.exports = NotSupportedException;