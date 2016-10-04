/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var ApplicationException = require('./ApplicationException');

/**
 * @class Jii.exceptions.InvalidConfigException
 * @extends Jii.exceptions.ApplicationException
 */
module.exports = Jii.defineClass('Jii.exceptions.InvalidConfigException', /** @lends Jii.exceptions.InvalidConfigException.prototype */{

	__extends: ApplicationException

});
