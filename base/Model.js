/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Validator = require('../validators/Validator');
var RequiredValidator = require('../validators/RequiredValidator');
var ChangeAttributeEvent = require('../data/ChangeAttributeEvent');
var ChangeEvent = require('../data/ChangeEvent');
var InvalidParamException = require('../exceptions/InvalidParamException');
var UnknownPropertyException = require('../exceptions/UnknownPropertyException');
var ApplicationException = require('../exceptions/ApplicationException');
var ValidateEvent = require('../data/ValidateEvent');
var _isObject = require('lodash/isObject');
var _isEmpty = require('lodash/isEmpty');
var _isEqual = require('lodash/isEqual');
var _isUndefined = require('lodash/isUndefined');
var _indexOf = require('lodash/indexOf');
var _isNumber = require('lodash/isNumber');
var _isArray = require('lodash/isArray');
var _isString = require('lodash/isString');
var _each = require('lodash/each');
var _has = require('lodash/has');
var _map = require('lodash/map');
var _keys = require('lodash/keys');
var _startCase = require('lodash/startCase');
var Component = require('./Component');

class Model extends Component {

    constructor(attributes, config) {
        super(config);

        if (_isObject(attributes)) {
            this.set(attributes);
        }
    }

    preInit(attributes, config) {
        this._editedChanges = {};
        this._editedSubModels = [];
        this._editedLevel = 0;
        this._scenario = 'default';
        this._validators = null;
        this._errors = {};
        this._attributes = {};

        super.preInit(config);
    }

    /**
     * Validation rules
     * @returns {Array}
     */
    rules() {
        return [];
    }

    /**
     * Begin change operation
     */
    beginEdit() {
        this._editedLevel++;
    }

    /**
     * Cancel all changes after beginEdit() call
     */
    cancelEdit() {
        if (this._editedLevel > 0) {
            this._editedLevel--;
        }

        // Cancel in sub-models
        if (this._editedLevel === 0) {
            _each(this._editedSubModels, subModel => {
                subModel.cancelEdit();
            });

            // Revert attribute changes
            _each(this._editedChanges, (values, name) => {
                this._attributes[name] = values[0];
            });
        }
    }

    /**
     * End change operation - trigger change events
     */
    endEdit() {
        if (this._editedLevel > 0) {
            this._editedLevel--;
        }

        if (this._editedLevel === 0) {
            // End in sub-models
            _each(this._editedSubModels, subModel => {
                subModel.endEdit();
            });

            // Trigger change attribute events
            if (!_isEmpty(this._editedChanges)) {
                _each(this._editedChanges, (values, name) => {
                    this.trigger(Model.EVENT_CHANGE_NAME + name, new ChangeAttributeEvent({
                        sender: this,
                        attribute: name,
                        oldValue: values[0],
                        newValue: values[1],
                        changedAttributes: this._editedChanges
                    }));
                });

                // Trigger change event
                this.trigger(Model.EVENT_CHANGE, new ChangeEvent({
                    sender: this,
                    changedAttributes: this._editedChanges
                }));
            }

            // Reset state
            this._editedSubModels = [];
            this._editedChanges = {};
        }
    }

    /**
     * Get attribute value
     * @param {String} name
     * @returns {*}
     */
    get(name) {
        if (this.hasAttribute(name)) {
            return this.getAttribute(name);
        }

        // Sub models support: foo[0]
        var collectionFormat = this._detectKeyFormatCollection(name, '', true);
        if (collectionFormat) {
            return collectionFormat.subName ? collectionFormat.model.get(collectionFormat.subName) : collectionFormat.model;
        }

        // Sub models support: foo.bar
        var modelFormat = this._detectKeyFormatModel(name);
        if (modelFormat) {
            return modelFormat.model ? modelFormat.model.get(modelFormat.subName) : null;
        }

        try {
            return super.get(name);
        } catch (e) {
            if (!(e instanceof UnknownPropertyException)) {
                throw e;
            }
            return null;
        }
    }

    /**
     * Set attribute value
     * @param {object|string} name
     * @param {*} [value]
     */
    set(name, value) {
        // Object format support
        if (_isObject(name)) {
            this.beginEdit();

            var isChanged = false;
            _each(name, (value, name) => {
                if (this.set(name, value)) {
                    isChanged = true;
                }
            });

            this.endEdit();
            return isChanged;
        }

        // Sub models support: foo[0].bar.zen
        var subMatches = /^(.+)\.([^\[\].]+)$/.exec(name);
        if (subMatches !== null) {
            var subModel = this.get(subMatches[1]);

            // Check sub-model is Model
            var Collection = require('./Collection');
            if (subModel instanceof Collection) {
                throw new InvalidParamException('Try set property of array models: `' + name + '`');
            } else if (!(subModel instanceof module.exports)) {
                throw new UnknownPropertyException('Setting property of null sub-model `' + name + '`');
            }

            subModel.beginEdit();
            this._editedSubModels.push(subModel);

            var isSubChanged = subModel.set(subMatches[2], value);

            this.endEdit();
            return isSubChanged;
        }

        if (this.hasAttribute(name)) {
            this.beginEdit();

            var oldValue = this._attributes[name];
            var isAttributeChanged = !_isEqual(oldValue, value);
            this._attributes[name] = value;

            if (isAttributeChanged) {
                this._editedChanges[name] = [
                    oldValue,
                    value
                ];
            }

            this.endEdit();
            return isAttributeChanged;
        }

        super.set(name, value);
    }

    /**
     *
     * @param {string} name
     * @param {string} [prefix]
     * @param {boolean} [skipThrow]
     * @returns {{model: Jii.data.BaseActiveRecord, name: string, subName: string}|null}
     * @protected
     */
    _detectKeyFormatCollection(name, prefix, skipThrow) {
        prefix = prefix || '';
        skipThrow = skipThrow || false;

        // Sub models support: change:foo[0]
        var arrRegExp = new RegExp('^' + prefix + '([^\\[\\].]+)\\[([-0-9]+)\\](\\.(.+))?$');
        var arrMatches = arrRegExp.exec(name);
        if (arrMatches === null) {
            return null;
        }

        var collection = this.get(arrMatches[1]);
        var Collection = require('./Collection');
        if (collection instanceof Collection) {
            var index = parseInt(arrMatches[2]);
            var arrSubModel = collection.at(index);
            if (arrSubModel) {
                return {
                    model: arrSubModel,
                    name: arrMatches[1],
                    subName: arrMatches[4] ? prefix + arrMatches[4] : null,
                    index: index
                };
            } else if (!skipThrow) {
                throw new InvalidParamException('Model with index `' + index + '` in collection `' + arrMatches[1] + '` is not found.');
            }
        } else if (!skipThrow) {
            throw new InvalidParamException('Relation `' + arrMatches[1] + '` is not collection.');
        }

        return null;
    }

    /**
     *
     * @param {string} name
     * @param {string} [prefix]
     * @returns {{model: Jii.data.BaseActiveRecord|null, name: string, subName: string}|null}
     * @protected
     */
    _detectKeyFormatModel(name, prefix) {
        prefix = prefix || '';

        if (prefix && name.indexOf(prefix) !== 0) {
            return null;
        }
        name = name.substr(prefix.length);

        var dotIndex = name.indexOf('.');
        if (dotIndex === -1) {
            return null;
        }

        var relationName = name.substr(0, dotIndex);

        return {
            model: this.get(relationName),
            name: relationName,
            subName: prefix + name.substr(dotIndex + 1)
        };
    }

    /**
     * Returns the named attribute value.
     * If this record is the result of a query and the attribute is not loaded,
     * null will be returned.
     * @param {string} name the attribute name
     * @returns {*} the attribute value. Null if the attribute is not set or does not exist.
     * @see hasAttribute()
     */
    getAttribute(name) {
        return _has(this._attributes, name) ? this._attributes[name] : null;
    }

    /**
     * Sets the named attribute value.
     * @param {string} name the attribute name
     * @param {*} value the attribute value.
     * @throws {Jii.exceptions.InvalidParamException} if the named attribute does not exist.
     * @see hasAttribute()
     */
    setAttribute(name, value) {
        if (this.hasAttribute(name)) {
            this.set(name, value);
        } else {
            throw new InvalidParamException(this.className() + ' has no attribute named "' + name + '".');
        }
    }

    /**
     * Update model attributes. This method run change
     * and change:* events, if attributes will be changes
     * @param attributes
     * @param {Boolean} [safeOnly]
     * @returns {boolean}
     */
    setAttributes(attributes, safeOnly) {
        if (_isUndefined(safeOnly)) {
            safeOnly = true;
        }

        var filteredAttributes = {};
        var attributeNames = safeOnly ? this.safeAttributes() : this.attributes();

        _each(attributes, (value, key) => {
            if (_indexOf(attributeNames, key) !== -1) {
                filteredAttributes[key] = value;
            } else if (safeOnly) {
                this.onUnsafeAttribute(key, value);
            }
        });

        return this.set(filteredAttributes);
    }

    /**
     *
     * @param {object|Jii.data.ModelAdapterInterface} adapter
     */
    createProxy(adapter) {
        var cloned = adapter.instance(this);

        var attributes = {};
        _each(adapter.attributes || this.attributes(), (name, alias) => {
            if (_isNumber(alias)) {
                alias = name;
            }
            attributes[alias] = name;
        });

        // Fill model
        var values = {};
        _each(attributes, (name, alias) => {
            values[alias] = this.get(name);
        });
        adapter.setValues(this, cloned, values);

        // Subscribe for sync
        _each(attributes, (name, alias) => {
            this.on(Model.EVENT_CHANGE_NAME + name, /** @param {Jii.data.ChangeAttributeEvent} event */
                                                    event => {
                var obj = {};
                obj[alias] = event.newValue;
                adapter.setValues(this, cloned, obj);
            });
        });

        return cloned;
    }

    /**
     * This method is invoked when an unsafe attribute is being massively assigned.
     * The default implementation will log a warning message if YII_DEBUG is on.
     * It does nothing otherwise.
     * @param {string} name the unsafe attribute name
     * @param {*} value the attribute value
     */
    onUnsafeAttribute(name, value) {
        if (Jii.debug) {
            Jii.trace('Failed to set unsafe attribute `' + name + '` in ' + this.className() + '`');
        }
    }

    /**
     * Returns attribute values.
     * @param {Array} [names]
     * @param {Array} [except]
     * @returns {{}} Attribute values (name => value).
     */
    getAttributes(names, except) {
        var values = {};

        if (!_isArray(names)) {
            names = this.attributes();
        }

        _each(names, name => {
            if (!_isArray(except) || _indexOf(except, name) === -1) {
                values[name] = this.get(name);
            }
        });

        return values;
    }

    /**
     * @param {string[]} names
     * @returns {{}}
     */
    getAttributesTree(names) {
        // Convert string names to tree
        var treeNames = {};
        _each(names, name => {
            var obj = treeNames;
            var keys = name.split('.');
            _each(keys, key => {
                obj[key] = obj[key] || {};
                obj = obj[key];
            });
        });

        return this._buildTree(treeNames, this);
    }

    _buildTree(names, model) {
        var obj = {};
        _each(names, (child, name) => {
            var value = model.get(name);
            var Collection = require('./Collection');
            if (value instanceof module.exports) {
                obj[name] = this._buildTree(child, value);
            } else if (value instanceof Collection) {
                obj[name] = _map(value.getModels(), item => this._buildTree(child, item));
            } else {
                obj[name] = value;
            }
        });
        return obj;
    }

    formName() {
        return this.className().replace(/^.*\.([^.]+)$/, '$1');
    }

    /**
     * Get attributes list for this model
     * @return {Array}
     */
    attributes() {
        return _keys(this._attributes);
    }

    /**
     * Check attribute exists in this model
     * @param {String} name
     * @returns {boolean}
     */
    hasAttribute(name) {
        //return true;
        return _indexOf(this.attributes(), name) !== -1;
    }

    /**
     * Format: attribute => label
     * @return {object}
     */
    attributeLabels() {
        return {};
    }

    /**
     * Get label by attribute name
     * @param {string} name
     * @returns {string}
     */
    getAttributeLabel(name) {
        var attributes = this.attributeLabels();
        return _has(attributes, name) ? attributes[name] : this.generateAttributeLabel(name);
    }

    /**
     * Format: attribute => hint
     * @return {object}
     */
    attributeHints() {
        return {};
    }

    /**
     * Get hint by attribute name
     * @param {string} name
     * @returns {string}
     */
    getAttributeHint(name) {
        var attributes = this.attributeHints();
        return _has(attributes, name) ? attributes[name] : '';
    }

    /**
     *
     * @param scenario
     */
    setScenario(scenario) {
        this._scenario = scenario;
    }

    /**
     *
     * @returns {string}
     */
    getScenario() {
        return this._scenario;
    }

    safeAttributes() {
        var scenario = this.getScenario();
        var scenarios = this.scenarios();

        if (!_has(scenarios, scenario)) {
            return [];
        }

        var attributes = [];
        _each(scenarios[scenario], attribute => {
            if (attribute.substr(0, 1) !== '!') {
                attributes.push(attribute);
            }
        });
        return attributes;
    }

    /**
     *
     * @returns {*}
     */
    activeAttributes() {
        var scenario = this.getScenario();
        var scenarios = this.scenarios();

        if (!_has(scenarios, scenario)) {
            return [];
        }

        var attributes = scenarios[scenario];
        _each(attributes, (attribute, i) => {
            if (attribute.substr(0, 1) === '!') {
                attributes[i] = attribute.substr(1);
            }
        });

        return attributes;
    }

    /**
     *
     * @returns {Object}
     */
    scenarios() {
        var scenarios = {};
        scenarios['default'] = [];

        _each(this.getValidators(), validator => {
            _each(validator.on, scenario => {
                scenarios[scenario] = [];
            });
            _each(validator.except, scenario => {
                scenarios[scenario] = [];
            });
        });
        var names = _keys(scenarios);

        _each(this.getValidators(), validator => {
            var validatorScenarios = validator.on && validator.on.length > 0 ? validator.on : names;
            _each(validatorScenarios, name => {
                if (!scenarios[name]) {
                    scenarios[name] = [];
                }

                if (_indexOf(validator.except, name) !== -1) {
                    return;
                }

                _each(validator.attributes, attribute => {

                    if (_indexOf(scenarios[name], attribute) !== -1) {
                        return;
                    }

                    scenarios[name].push(attribute);
                });
            });
        });

        return scenarios;
    }

    /**
     *
     * @returns {Array}
     */
    createValidators() {
        var validators = [];
        _each(this.rules(), rule => {
            if (rule instanceof Validator) {
                validators.push(rule);
            } else if (_isArray(rule) && rule.length >= 2) {
                var attributes = _isString(rule[0]) ? [rule[0]] : rule[0];
                var params = rule[2] || {};

                if (params.on) {
                    params.on = _isString(params.on) ? [params.on] : params.on;
                }

                var validator = Validator.create(rule[1], this, attributes, params);
                validators.push(validator);
            } else {
                throw new ApplicationException('Invalid validation rule: a rule must specify both attribute names and validator type.');
            }
        });
        return validators;
    }

    /**
     *
     * @returns {*}
     */
    getValidators() {
        if (this._validators === null) {
            this._validators = this.createValidators();
        }
        return this._validators;
    }

    /**
     *
     * @param [attribute]
     * @returns {Array}
     */
    getActiveValidators(attribute) {
        var validators = [];
        var scenario = this.getScenario();

        _each(this.getValidators(), validator => {
            if (!validator.isActive(scenario)) {
                return;
            }

            if (attribute && _indexOf(validator.attributes, attribute) === -1) {
                return;
            }

            validators.push(validator);
        });

        return validators;
    }

    /**
     * Validate model by rules, see rules() method.
     * @param {Array} [attributes]
     * @param {Boolean} [isClearErrors]
     */
    validate(attributes, isClearErrors) {
        if (_isUndefined(isClearErrors)) {
            isClearErrors = true;
        }
        if (!attributes) {
            attributes = this.activeAttributes();
        }

        var scenarios = this.scenarios();
        var scenario = this.getScenario();
        if (!_has(scenarios, scenario)) {
            throw new ApplicationException('Unknown scenario `' + scenario + '`.');
        }

        if (isClearErrors) {
            this.clearErrors();
        }

        return Promise.resolve(this.beforeValidate()).then(bool => {
            if (!bool) {
                return Promise.resolve(false);
            }

            var promises = _map(this.getActiveValidators(), validator => {
                return validator.validate(this, attributes);
            });
            return Promise.all(promises);
        }).then(() => this.afterValidate()).then(() => {
            if (this.hasErrors()) {
                return Promise.resolve(false);
            }

            // Return result
            return Promise.resolve(true);
        });
    }

    addError(attribute, error) {
        if (!this._errors[attribute]) {
            this._errors[attribute] = [];
        }

        this._errors[attribute].push(error);

        this.trigger(Model.EVENT_CHANGE_ERRORS, new ValidateEvent({
            errors: this._errors
        }));
    }

    setErrors(errors) {
        this._errors = errors;

        this.trigger(Model.EVENT_CHANGE_ERRORS, new ValidateEvent({
            errors: this._errors
        }));
    }

    /**
     *
     * @param [attribute]
     * @returns {*}
     */
    getErrors(attribute) {
        return !attribute ? this._errors : this._errors[attribute] || [];
    }

    /**
     *
     * @param [attribute]
     * @returns {*}
     */
    hasErrors(attribute) {
        return attribute ? _has(this._errors, attribute) : !_isEmpty(this._errors);
    }

    /**
     *
     * @param [attribute]
     * @returns {*}
     */
    clearErrors(attribute) {
        if (!attribute) {
            this._errors = {};
        } else if (this._errors) {
            delete this._errors[attribute];
        }

        this.trigger(Model.EVENT_CHANGE_ERRORS, new ValidateEvent({
            errors: this._errors
        }));
    }

    beforeValidate() {
        this.trigger(Model.EVENT_BEFORE_VALIDATE, new ValidateEvent());
        return true;
    }

    afterValidate() {
        this.trigger(Model.EVENT_AFTER_VALIDATE, new ValidateEvent({
            errors: this._errors
        }));
    }

    /**
     * Returns a value indicating whether the attribute is required.
     * This is determined by checking if the attribute is associated with a
     * [[\jii\validators\RequiredValidator|required]] validation rule in the
     * current [[scenario]].
     *
     * @param {string} attribute name
     * @returns {boolean} whether the attribute is required
     */
    isAttributeRequired(attribute) {
        var bool = false;
        _each(this.getActiveValidators(attribute), validator => {
            if (validator instanceof RequiredValidator) {
                bool = true;
            }
        });
        return bool;
    }

    /**
     * Returns a value indicating whether the attribute is safe for massive assignments.
     * @param {string} attribute attribute name
     * @returns {boolean} whether the attribute is safe for massive assignments
     * @see safeAttributes()
     */
    isAttributeSafe(attribute) {
        return _indexOf(this.safeAttributes(), attribute) !== -1;
    }

    /**
     * Returns a value indicating whether the attribute is active in the current scenario.
     * @param {string} attribute attribute name
     * @returns {boolean} whether the attribute is active in the current scenario
     * @see activeAttributes()
     */
    isAttributeActive(attribute) {
        return _indexOf(this.activeAttributes(), attribute) !== -1;
    }

    /**
     * Returns the first error of every attribute in the model.
     * @returns {object} the first errors. The array keys are the attribute names, and the array
     * values are the corresponding error messages. An empty array will be returned if there is no error.
     * @see getErrors()
     * @see getFirstError()
     */
    getFirstErrors() {
        if (_isEmpty(this._errors)) {
            return {};
        }

        var errors = {};
        _each(this._errors, (es, name) => {
            if (es.length > 0) {
                errors[name] = es[0];
            }
        });

        return errors;
    }

    /**
     * Returns the first error of the specified attribute.
     * @param {string} attribute attribute name.
     * @returns {string|null} the error message. Null is returned if no error.
     * @see getErrors()
     * @see getFirstErrors()
     */
    getFirstError(attribute) {
        return _has(this._errors, attribute) ? this._errors[attribute][0] : null;
    }

    /**
     * Generates a user friendly attribute label based on the give attribute name.
     * This is done by replacing underscores, dashes and dots with blanks and
     * changing the first letter of each word to upper case.
     * For example, 'department_name' or 'DepartmentName' will generate 'Department Name'.
     * @param {string} name the column name
     * @returns {string} the attribute label
     */
    generateAttributeLabel(name) {
        return _startCase(name);
    }

}

/**
 * @event Jii.base.Model#after_validate
 * @property {Jii.data.ValidateEvent} event
 */
Model.EVENT_AFTER_VALIDATE = 'after_validate';

/**
 * @event Jii.base.Model#change_errors
 * @property {Jii.data.ValidateEvent} event
 */
Model.EVENT_CHANGE_ERRORS = 'change_errors';

/**
 * @event Jii.base.Model#before_validate
 * @property {Jii.data.ValidateEvent} event
 */
Model.EVENT_BEFORE_VALIDATE = 'before_validate';

/**
 * @event Jii.base.Model#change:
 * @property {Jii.data.ChangeAttributeEvent} event
 */
Model.EVENT_CHANGE_NAME = 'change:';

/**
 * @event Jii.base.Model#change
 * @property {Jii.data.ChangeEvent} event
 */
Model.EVENT_CHANGE = 'change';
module.exports = Model;