/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

/**
 * @class Jii.exceptions.ApplicationException
 * @extends Error
 */
Jii.defineClass('Jii.exceptions.ApplicationException', {

	__extends: Error,

	constructor: function (message) {
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.__static);
		}
		this.name = this.__className;
		this.message = message || '';
	}
});
