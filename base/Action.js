/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var InvalidConfigException = require('../exceptions/InvalidConfigException');
var _isFunction = require('lodash/isFunction');
var Object = require('./Object');

/**
 * @class Jii.base.Action
 * @extends Jii.base.Object
 */
module.exports = Jii.defineClass('Jii.base.Action', /** @lends Jii.base.Action.prototype */{

	__extends: Object,

	/**
	 * @type {string} ID of the action
	 */
	id: null,

	/**
	 * @type {Jii.base.Controller} the controller that owns this action
	 */
	controller: null,

	constructor(id, controller, config) {
		this.id = id;
		this.controller = controller;
		this.__super(config);
	},

	/**
	 * Returns the unique ID of this action among the whole application.
	 * @returns {string} the unique ID of this action among the whole application.
	 */
	getUniqueId() {
		return this.controller.getUniqueId() + '/' + this.id;
	},

	/**
	 * @param {Jii.base.Context} context
	 */
	run(context) {
	},

	/**
	 * Runs this action with the specified parameters.
	 * This method is mainly invoked by the controller.
	 * @param {Jii.base.Context} context
	 * @returns {Promise} the result of the action
	 * @throws {Jii.exceptions.InvalidConfigException} if the action class does not have a run() method
	 */
	runWithParams(context) {
		if (!_isFunction(this.run)) {
			throw new InvalidConfigException(this.className() + ' must define a `run()` method.');
		}

		//Yii::trace('Running action: ' . get_class($this) . '::run()', __METHOD__);

		return Promise.resolve(this.beforeRun(context))
			.then(bool => {
				if (!bool) {
					return Promise.reject();
				}

				return this.run(context);
			})
			.then(result => {
				return Promise.resolve(this.afterRun()).then(() => result );
			});
	},

	/**
	 * This method is called right before `run()` is executed.
	 * You may override this method to do preparation work for the action run.
	 * If the method returns false, it will cancel the action.
	 * @param {Jii.base.Context} context
	 * @return {Promise|boolean} whether to run the action.
	 */
	beforeRun(context) {
		return true;
	},

	/**
	 * This method is called right after `run()` is executed.
	 * You may override this method to do post-processing work for the action run.
	 */
	afterRun() {
	}

});
