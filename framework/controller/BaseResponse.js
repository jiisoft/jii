/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

/**
 * @class Jii.controller.BaseResponse
 * @extends Jii.base.Component
 */
Jii.defineClass('Jii.controller.BaseResponse', {

	__extends: Jii.base.Component,

	/**
	 * @var {boolean} whether the response has been sent. If this is true, calling [[send()]] will do nothing.
	 */
	isSent: false,

	/**
	 * Sends the response to client.
	 */
	send: function () {
	}

});
