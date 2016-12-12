/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var ApplicationException = require('./ApplicationException');
class InvalidParamException extends ApplicationException {

}
module.exports = InvalidParamException;