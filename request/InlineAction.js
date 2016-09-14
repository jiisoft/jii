/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../Jii');
var Action = require('../base/Action');

/**
 * @class Jii.request.InlineAction
 * @extends Jii.base.Action
 */
module.exports = Jii.defineClass('Jii.request.InlineAction', /** @lends Jii.request.InlineAction */{

	__extends: Action,

	/**
	 * @type {string} the controller method that  this inline action is associated with
	 */
	actionMethod: null,

	constructor(id, controller, actionMethod, config) {
		this.actionMethod = actionMethod;
		this.__super(id, controller, config);
	},

	/**
	 * Runs this action with the specified parameters.
	 * This method is mainly invoked by the controller.
	 * @param {Jii.base.Context} context
	 * @returns {*} the result of the action
	 */
	runWithParams(context) {
        return Promise.resolve().then(() => {
            return this.controller[this.actionMethod].call(this.controller, context);
        });
	}
});
