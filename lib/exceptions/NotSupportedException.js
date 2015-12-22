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
 * @class Jii.exceptions.NotSupportedException
 * @extends Jii.exceptions.ApplicationException
 */
Jii.defineClass('Jii.exceptions.NotSupportedException', /** @lends Jii.exceptions.NotSupportedException.prototype */{

	__extends: 'Jii.exceptions.ApplicationException'

});
