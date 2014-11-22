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
 * @class Jii.exceptions.InvalidConfigException
 * @extends Jii.exceptions.ApplicationException
 */
Jii.defineClass('Jii.exceptions.InvalidConfigException', /** @lends Jii.exceptions.InvalidConfigException.prototype */{

	__extends: Jii.exceptions.ApplicationException

});
