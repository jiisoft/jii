/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var _isString = require('lodash/isString');
var _each = require('lodash/each');
var Validator = require('./Validator');

/**
 * @class Jii.validators.UrlValidator
 * @extends Jii.validators.Validator
 */
var UrlValidator = Jii.defineClass('Jii.validators.UrlValidator', /** @lends Jii.validators.UrlValidator.prototype */{

    __extends: Validator,

	pattern: /^{schemes}:\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)/i,

    validSchemes: [
        'http',
        'https'
    ],

    defaultScheme: null,

    init() {
        this.__super();
        if (this.message === null) {
            this.message = Jii.t('jii', '{attribute} is not a valid URL.');
        }
    },

    validateAttribute(object, attribute) {
        var value = object.get(attribute);
        if (!this.validateValue(value)) {
            this.addError(object, attribute, this.message);
        } else if (this.defaultScheme !== null && value.indexOf('://') === -1) {
            object.set(attribute, this.defaultScheme + '://' + value);
        }
    },

    validateValue(value) {
        if (!_isString(value) || value.length > 2000) {
            return false;
        }

        if (this.defaultScheme !== null && value.indexOf('://') === -1) {
            value = this.defaultScheme + '://' + value;
        }

        var pattern = this.pattern.source;
        pattern = pattern.replace('{schemes}', '(' + this.validSchemes.join('|') + ')');

        var flags = '';
        _each({global: 'g', ignoreCase: 'i', multiline: 'm'}, (flag, key) => {
            if (this.pattern[key]) {
                flags += flag;
            }
        });

        return (new RegExp(pattern, flags)).test(value);
    }

});

module.exports = UrlValidator;