/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');

/**
 * @class Jii.exceptions.ApplicationException
 * @extends Error
 */
var ApplicationException = Jii.defineClass('Jii.exceptions.ApplicationException', /** @lends Jii.exceptions.ApplicationException.prototype */ {

	__extends: Error,

	constructor(message) {
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.__static);
		}
		this.name = this.__className;
		this.message = message || '';
	}
});

module.exports = ApplicationException;