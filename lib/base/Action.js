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

require('./Object');

/**
 * @class Jii.base.Action
 * @extends Jii.base.Object
 */
Jii.defineClass('Jii.base.Action', {

	__extends: Jii.base.Object,

	/**
	 * @type {string} ID of the action
	 */
	id: null,

	/**
	 * @type {Jii.base.Controller} the controller that owns this action
	 */
	controller: null,

	constructor: function (id, controller, config) {
		this.id = id;
		this.controller = controller;
		this.__super(config);
	},

	/**
	 * Returns the unique ID of this action among the whole application.
	 * @returns {string} the unique ID of this action among the whole application.
	 */
	getUniqueId: function () {
		return this.controller.getUniqueId() + '/' + this.id;
	},

	/**
	 * @param {Jii.base.Context} context
	 */
	run: function (context) {
	},

	/**
	 * Runs this action with the specified parameters.
	 * This method is mainly invoked by the controller.
	 * @param {Jii.base.Context} context
	 * @returns {Jii.when} the result of the action
	 * @throws {Jii.exceptions.InvalidConfigException} if the action class does not have a run() method
	 */
	runWithParams: function (context) {
		if (!Jii._.isFunction(this.run)) {
			throw new Jii.exceptions.InvalidConfigException(this.debugClassName + ' must define a `run()` method.');
		}

		//Yii::trace('Running action: ' . get_class($this) . '::run()', __METHOD__);

		return Jii.when.resolve(this.beforeRun(context))
			.then(Jii._.bind(function (bool) {
				if (!bool) {
					return Jii.when.reject();
				}

				return this.run(context);
			}, this))
			.then(Jii._.bind(function (result) {
				return Jii.when.resolve(this.afterRun()).then(function () {
					return result;
				});
			}, this));
	},

	/**
	 * This method is called right before `run()` is executed.
	 * You may override this method to do preparation work for the action run.
	 * If the method returns false, it will cancel the action.
	 * @param {Jii.base.Context} context
	 * @return {Jii.when|boolean} whether to run the action.
	 */
	beforeRun: function (context) {
		return true;
	},

	/**
	 * This method is called right after `run()` is executed.
	 * You may override this method to do post-processing work for the action run.
	 */
	afterRun: function () {
	}

});
