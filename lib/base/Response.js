/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('../Jii');

/**
 * @class Jii.base.Response
 * @extends Jii.base.Component
 */
Jii.defineClass('Jii.base.Response', {

	__extends: 'Jii.base.Component',

	/**
	 * @var {boolean} whether the response has been sent. If this is true, calling [[send()]] will do nothing.
	 */
	isSent: false,

    /**
     * The original response data
     * @type {*}
     */
    data: null,

	/**
	 * Sends the response to client.
	 */
	send() {
	}

});
