/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var _isString = require('lodash/isString');
var Validator = require('./Validator');

/**
 * @class Jii.validators.EmailValidator
 * @extends Jii.validators.Validator
 */
var EmailValidator = Jii.defineClass('Jii.validators.EmailValidator', /** @lends Jii.validators.EmailValidator.prototype */{

    __extends: Validator,

	pattern: /^[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/,

    fullPattern: /^[^@]*<[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?>$/,

    allowName: false,

    init() {
        this.__super();
        if (this.message === null) {
            this.message = Jii.t('jii', '{attribute} is not a valid email address.');
        }
    },

    validateAttribute(object, attribute) {
        var value = object.get(attribute);
        if (!this.validateValue(value)) {
            this.addError(object, attribute, this.message);
        }
    },

    validateValue(value) {
        if (!_isString(value) || value.length > 320) {
            return false;
        }

        return this.pattern.test(value) || (this.allowName && this.fullPattern.test(value));
    }

});

module.exports = EmailValidator;