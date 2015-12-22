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

require('../base/Action');

/**
 * @class Jii.request.InlineAction
 * @extends Jii.base.Action
 */
Jii.defineClass('Jii.request.InlineAction', /** @lends Jii.request.InlineAction */{

	__extends: 'Jii.base.Action',

	/**
	 * @type {string} the controller method that  this inline action is associated with
	 */
	actionMethod: null,

	constructor: function (id, controller, actionMethod, config) {
		this.actionMethod = actionMethod;
		this.__super(id, controller, config);
	},

	/**
	 * Runs this action with the specified parameters.
	 * This method is mainly invoked by the controller.
	 * @param {Jii.base.Context} context
	 * @returns {*} the result of the action
	 */
	runWithParams: function (context) {
        return Promise.resolve().then(function() {
            return this.controller[this.actionMethod].call(this.controller, context);
        }.bind(this));
	}
});
