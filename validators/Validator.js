/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var ApplicationException = require('../exceptions/ApplicationException');
var _isFunction = require('lodash/isFunction');
var _isArray = require('lodash/isArray');
var _indexOf = require('lodash/indexOf');
var _isString = require('lodash/isString');
var _extend = require('lodash/extend');
var _intersection = require('lodash/intersection');
var _map = require('lodash/map');
var _each = require('lodash/each');
var BaseObject = require('../base/Object');
class Validator extends BaseObject {

    preInit() {
        this.deferred = null;
        this.skipOnEmpty = true;
        this.skipOnError = true;
        this.except = [];
        this.on = [];
        this.message = null;
        this.attributes = [];
        super.preInit(...arguments);
    }

    static getDefaultValidator(type) {
        switch (type) {
            case 'boolean':
                return require('./BooleanValidator');

            case 'compare':
                return require('./CompareValidator');

            case 'date':
                return require('./DateValidator');

            case 'default':
                return require('./DefaultValueValidator');

                return require('./NumberValidator');

            case 'email':
                return require('./EmailValidator');

            case 'filter':
                return require('./FilterValidator');

            case 'in':
                return require('./RangeValidator');

            case 'number':
            case 'double':
            case 'integer':
                return {
                    'className': require('./NumberValidator'),
                    'integerOnly': type === 'integer'
                };

            case 'match':
                return require('./RegularExpressionValidator');

            case 'required':
                return require('./RequiredValidator');

            case 'safe':
                return require('./SafeValidator');

            case 'string':
                return require('./StringValidator');

            case 'url':
                return require('./UrlValidator');
        }

        return null;
    }

    static create(type, object, attributes, params) {
        params = params || {};
        params.attributes = attributes;

        if (_isFunction(object[type])) {
            params.className = require('./InlineValidator');
            params.method = type;
        } else {
            type = this.getDefaultValidator(type) || type;

            if (_isString(type) || _isFunction(type)) {
                params.className = type;
            } else {
                _extend(params, type);
            }
        }

        return Jii.createObject(params);
    }

    /**
     * @abstract
     * @param object
     * @param attribute
     * @returns {Promise|null}
     */
    validateAttribute(object, attribute) {}

    validateValue() {
        throw new ApplicationException('Not found implementation for method `validateValue()`.');
    }

    validate(object, attributes) {
        attributes = _isArray(attributes) ? _intersection(this.attributes, attributes) : this.attributes;

        var promises = _map(attributes, attribute => {
            if (this.skipOnError && object.hasErrors(attribute)) {
                return;
            }

            if (this.skipOnEmpty && this.isEmpty(object.get(attribute))) {
                return;
            }

            return this.validateAttribute(object, attribute);
        });

        return Promise.all(promises);
    }

    isActive(scenario) {
        return _indexOf(this.except, scenario) === -1 && (!this.on || this.on.length === 0 || _indexOf(this.on, scenario) !== -1);
    }

    addError(object, attribute, message, params) {
        params = params || {};
        params.attribute = object.getAttributeLabel(attribute);
        params.value = object.get(attribute);

        // @todo
        //message = Jii.t('jii', message);
        _each(params, (value, key) => {
            message = message.replace('{' + key + '}', value);
        });

        object.addError(attribute, message);
        Jii.warning('Validation error in model `' + object.className() + '`: ' + message);
    }

    isEmpty(value, isTrim) {
        return value === null || value === '' || isTrim && _isString(value) && value.replace(/^\s+|\s+$/g, '') === '' || _isArray(value) && value.length === 0;
    }

}
module.exports = Validator;