/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var _isArray = require('lodash/isArray');
var _isNaN = require('lodash/isNaN');
var Validator = require('./Validator');

/**
 * @class Jii.validators.DateValidator
 * @extends Jii.validators.Validator
 */
var DateValidator = Jii.defineClass('Jii.validators.DateValidator', /** @lends Jii.validators.DateValidator.prototype */{

    __extends: Validator,

	format: 'Y-m-d',

    timestampAttribute: null,

    init() {
        this.__super();
        if (this.message === null) {
            this.message = Jii.t('jii', 'The format of {attribute} is invalid.');
        }
    },

    validateAttribute(object, attribute) {
        var value = object.get(attribute);

        if (_isArray(value)) {
            this.addError(object, attribute, this.message);
            return;
        }

        if (!this.validateValue(value)) {
            this.addError(object, attribute, this.message);
        } else if (this.timestampAttribute !== null) {
            // @todo Parse by format
            var timestamp = Date.parse(value);
            object.set(this.timestampAttribute, Math.round(timestamp / 1000));
        }
    },

    validateValue(value) {
        // @todo Validate by format
        var timestamp = Date.parse(value);
        return !_isNaN(timestamp);
    }

});

module.exports = DateValidator;