/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

/**
 * @class Jii.controller.InlineAction
 * @extends Jii.controller.BaseAction
 */
Jii.defineClass('Jii.controller.InlineAction', {

	__extends: Jii.controller.BaseAction,

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
		return this.controller[this.actionMethod].call(this.controller, context);
	}
});
