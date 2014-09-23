/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

/**
 * @class Jii.data.Model
 * @extends Jii.base.Component
 */
Jii.defineClass('Jii.data.Model', {

	__extends: Jii.base.Component,

	_attributes: null,
	_errors: null,
	_validators: null,
	_scenario: 'default',

	constructor: function () {
		this._attributes = this._attributes || {};
		this._errors = {};

		this.init();

		this.__super.apply(this, arguments);
	},

	init: function () {

	},

	/**
	 * Get attribute value
	 * @param {String} key
	 * @returns {*}
	 */
	get: function (key) {
		return !_.isUndefined(this._attributes[key]) ? this._attributes[key] : null;
	},

	/**
	 * Set attribute value
	 * @param {String} key
	 * @param {*} value
	 * @returns {Boolean} True, if model changed
	 */
	set: function (key, value) {
		if (!this.hasAttribute(key)) {
			throw new Jii.exceptions.ApplicationException('Not find attribute `' + key + '`');
		}

		// Check changes
		if (_.isEqual(this._attributes[key], value)) {
			return false;
		}

		this._attributes[key] = value;
		// @todo Move to browser model
		//this.trigger('change:' + key, this, this._attributes[key]);

		return true;
	},

	/**
	 * Validation rules
	 * @returns {array}
	 */
	rules: function () {
		return [];
	},

	/**
	 * Update model attributes. This method run change
	 * and change:* events, if attributes will be changes
	 * @param attributes
	 * @param {Boolean} [safeOnly]
	 * @returns {boolean}
	 */
	setAttributes: function (attributes, safeOnly) {
		if (_.isUndefined(safeOnly)) {
			safeOnly = true;
		}

		var isChanged = false;
		var attributeNames = safeOnly ? this.safeAttributes() : this.attributes();

		_.each(attributes, _.bind(function (value, key) {
			if (_.indexOf(attributeNames, key) !== -1) {
				isChanged = this.set(key, value);
			} else if (safeOnly) {
				this.onUnsafeAttribute(key, value);
			}
		}, this));

		if (isChanged) {
			// @todo Move to browser model
			//this.trigger('change', this);
		}
		return isChanged;
	},

	/**
	 * This method is invoked when an unsafe attribute is being massively assigned.
	 * The default implementation will log a warning message if YII_DEBUG is on.
	 * It does nothing otherwise.
	 * @param {string} name the unsafe attribute name
	 * @param {*} value the attribute value
	 */
	onUnsafeAttribute: function (name, value) {
		if (Jii.debug) {
			Jii.trace('Failed to set unsafe attribute `' + name + '` in ' + this.className() + '`');
		}
	},

	/**
	 * Returns attribute values.
	 * @param {Array} [names]
	 * @param {Array} [except]
	 * @returns {{}} Attribute values (name => value).
	 */
	getAttributes: function (names, except) {
		var values = {};

		if (!_.isArray(names)) {
			names = this.attributes();
		}

		_.each(names, _.bind(function (name) {
			if (!_.isArray(except) || _.indexOf(name, except) === -1) {
				values[name] = this.get(name);
			}
		}, this));

		return values;
	},

	/**
	 * Get attributes list for this model
	 * @return {Array}
	 */
	attributes: function () {
		return _.keys(this._attributes);
	},

	/**
	 * Check attribute exists in this model
	 * @param {String} name
	 * @returns {boolean}
	 */
	hasAttribute: function (name) {
		//return true;
		return _.indexOf(this.attributes(), name) !== -1;
	},

	/**
	 * Format: attribute => label
	 * @return {object}
	 */
	attributeLabels: function () {
		return {};
	},

	/**
	 * Get label by attribute name
	 * @param {string} name
	 * @returns {string}
	 */
	getAttributeLabel: function (name) {
		var attributes = this.attributeLabels();
		return _.has(attributes, name) ? attributes[name] : name;
	},

	/**
	 *
	 * @param scenario
	 */
	setScenario: function (scenario) {
		this._scenario = scenario;
	},

	/**
	 *
	 * @returns {string}
	 */
	getScenario: function () {
		return this._scenario;
	},

	safeAttributes: function () {
		var scenario = this.getScenario();
		var scenarios = this.scenarios();

		if (!_.has(scenarios, scenario)) {
			return [];
		}

		var attributes = [];
		_.each(scenarios[scenario], function (attribute, i) {
			if (attribute.substr(0, 1) !== '!') {
				attributes.push(attribute);
			}
		});
		return attributes;
	},

	/**
	 *
	 * @returns {*}
	 */
	activeAttributes: function () {
		var scenario = this.getScenario();
		var scenarios = this.scenarios();

		if (!_.has(scenarios, scenario)) {
			return [];
		}

		var attributes = scenarios[scenario];
		_.each(attributes, function (attribute, i) {
			if (attribute.substr(0, 1) === '!') {
				attributes[i] = attribute.substr(1);
			}
		});

		return attributes;
	},

	/**
	 *
	 * @returns {Object}
	 */
	scenarios: function () {
		var scenarios = {};

		_.each(this.getValidators(), function (validator) {
			var validatorScenarios = validator.on.length > 0 ? validator.on : names;
			_.each(validatorScenarios, function (name) {
				if (!scenarios[name]) {
					scenarios[name] = [];
				}

				if (_.indexOf(validator.except, name) !== -1) {
					return;
				}

				_.each(validator.attributes, function (attribute) {

					if (_.indexOf(scenarios[name], attribute) !== -1) {
						return;
					}

					scenarios[name].push(attribute);
				});
			});
		});

		return scenarios;
	},

	/**
	 *
	 * @returns {Array}
	 */
	createValidators: function () {
		var validators = [];
		_.each(this.rules(), _.bind(function (rule) {
			if (rule instanceof Jii.validator.Validator) {
				validators.push(rule);
			} else if (_.isArray(rule) && rule.length >= 2) {
				var attributes = _.isString(rule[0]) ? [rule[0]] : rule[0];
				var params = rule[2] || {};
				params.on = _.isString(params.on) ? [params.on] : params.on;

				var validator = Jii.validator.Validator.create(rule[1], this, attributes, params);
				validators.push(validator);
			} else {
				throw new Jii.exceptions.ApplicationException('Invalid validation rule: a rule must specify both attribute names and validator type.');
			}
		}, this));
		return validators;
	},

	/**
	 *
	 * @returns {*}
	 */
	getValidators: function () {
		if (this._validators === null) {
			this._validators = this.createValidators();
		}
		return this._validators;
	},

	/**
	 *
	 * @param [attribute]
	 * @returns {Array}
	 */
	getActiveValidators: function (attribute) {
		var validators = [];
		var scenario = this.getScenario();

		_.each(this.getValidators(), function (validator) {
			if (!validator.isActive(scenario)) {
				return;
			}

			if (attribute && _.indexOf(validator.attributes, attribute) === -1) {
				return;
			}

			validators.push(validator);
		});

		return validators;
	},

	/**
	 * Validate model by rules, see rules() method.
	 * @param {Array} [attributes]
	 * @param {Boolean} [isClearErrors]
	 */
	validate: function (attributes, isClearErrors) {
		if (_.isUndefined(isClearErrors)) {
			isClearErrors = true;
		}
		if (!attributes) {
			attributes = this.activeAttributes();
		}

		var scenarios = this.scenarios();
		var scenario = this.getScenario();
		if (!_.has(scenarios, scenario)) {
			throw new Jii.exceptions.ApplicationException('Unknow scenario `' + scenario + '`.');
		}

		if (isClearErrors) {
			this.clearErrors();
		}

		return Promise.resolve(this.beforeValidate())
			.then(_.bind(function (bool) {
				if (!bool) {
					return Promise.reject();
				}

				var promises = _.map(this.getActiveValidators(), _.bind(function (validator) {
					return validator.validate(this, attributes);
				}, this));
				return Promise.all(promises);
			}, this))
			.then(this.afterValidate)
			.then(_.bind(function () {
				if (this.hasErrors()) {
					return Promise.reject();
				}

				// Return result
				return Promise.resolve();
			}, this));
	},

	addError: function (attribute, error) {
		if (!this._errors[attribute]) {
			this._errors[attribute] = [];
		}

		this._errors[attribute].push(error);
	},

	/**
	 *
	 * @param [attribute]
	 * @returns {*}
	 */
	getErrors: function (attribute) {
		return !attribute ? this._errors : this._errors[attribute] || {};
	},

	/**
	 *
	 * @param [attribute]
	 * @returns {*}
	 */
	hasErrors: function (attribute) {
		return attribute ? _.has(this._errors, attribute) : !_.isEmpty(this._errors);
	},

	/**
	 *
	 * @param [attribute]
	 * @returns {*}
	 */
	clearErrors: function (attribute) {
		if (!attribute) {
			this._errors = {};
		} else {
			delete this._errors[attribute];
		}
	},

	beforeValidate: function () {
		return true;
	},

	afterValidate: function () {
	},






	/**
	 * Returns a value indicating whether the attribute is required.
	 * This is determined by checking if the attribute is associated with a
	 * [[\jii\validators\RequiredValidator|required]] validation rule in the
	 * current [[scenario]].
	 *
	 * Note that when the validator has a conditional validation applied using
	 * [[\jii\validators\RequiredValidator.when|when]] this method will return
	 * `false` regardless of the `when` condition because it may be called be
	 * before the model is loaded with data.
	 *
	 * @param {string} attribute attribute name
	 * @returns {boolean} whether the attribute is required
	 */
	isAttributeRequired: function (attribute) {
		var bool = false;
		_.each(this.getActiveValidators(attribute), _.bind(function(validator) {
			if (validator instanceof Jii.validator.RequiredValidator && validator.when === null) {
				bool = true;
			}
		}, this));
		return bool;
	},

	/**
	 * Returns a value indicating whether the attribute is safe for massive assignments.
	 * @param {string} attribute attribute name
	 * @returns {boolean} whether the attribute is safe for massive assignments
	 * @see safeAttributes()
	 */
	isAttributeSafe: function (attribute) {
		return _.indexOf(this.safeAttributes(), attribute) !== -1;
	},

	/**
	 * Returns a value indicating whether the attribute is active in the current scenario.
	 * @param {string} attribute attribute name
	 * @returns {boolean} whether the attribute is active in the current scenario
	 * @see activeAttributes()
	 */
	isAttributeActive: function (attribute) {
		return _.indexOf(this.activeAttributes(), attribute) !== -1;
	},

	/**
	 * Returns the first error of every attribute in the model.
	 * @returns {object} the first errors. The array keys are the attribute names, and the array
	 * values are the corresponding error messages. An empty array will be returned if there is no error.
	 * @see getErrors()
	 * @see getFirstError()
	 */
	getFirstErrors: function () {
		if (_.isEmpty(this._errors)) {
			return {};
		}

		var errors = {};
		_.each(this._errors, _.bind(function(es, name) {
			if (es.length > 0) {
				errors[name] = es[0];
			}
		}, this));

		return errors;
	},

	/**
	 * Returns the first error of the specified attribute.
	 * @param {string} attribute attribute name.
	 * @returns {string} the error message. Null is returned if no error.
	 * @see getErrors()
	 * @see getFirstErrors()
	 */
	getFirstError: function (attribute) {
		return _.has(this._errors, attribute) ? this._errors[attribute][0] : null;
	},

	/**
	 * Generates a user friendly attribute label based on the give attribute name.
	 * This is done by replacing underscores, dashes and dots with blanks and
	 * changing the first letter of each word to upper case.
	 * For example, 'department_name' or 'DepartmentName' will generate 'Department Name'.
	 * @param {string} name the column name
	 * @returns {string} the attribute label
	 */
	generateAttributeLabel: function (name) {
		return _.string.humanize(name);
	}

});
