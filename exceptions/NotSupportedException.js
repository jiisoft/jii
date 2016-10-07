/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var ApplicationException = require('./ApplicationException');

/**
 * @class Jii.exceptions.NotSupportedException
 * @extends Jii.exceptions.ApplicationException
 */
var NotSupportedException = Jii.defineClass('Jii.exceptions.NotSupportedException', /** @lends Jii.exceptions.NotSupportedException.prototype */{

	__extends: ApplicationException

});

module.exports = NotSupportedException;