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
 * @class Jii.exceptions.InvalidCallException
 * @extends Jii.exceptions.ApplicationException
 */
Jii.defineClass('Jii.exceptions.InvalidCallException', /** @lends Jii.exceptions.InvalidCallException.prototype */{

	__extends: 'Jii.exceptions.ApplicationException'

});
