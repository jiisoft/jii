/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Validator = require('./Validator');

/**
 * @class Jii.validators.DefaultValueValidator
 * @extends Jii.validators.Validator
 */
var DefaultValueValidator = Jii.defineClass('Jii.validators.DefaultValueValidator', /** @lends Jii.validators.DefaultValueValidator.prototype */{

    __extends: Validator,

	value: null,

    skipOnEmpty: false,

    init() {
        this.__super();
        if (this.message === null) {
            this.message = ''; // @todo
        }
    },

    validateAttribute(object, attribute) {
        if (this.isEmpty(object.get(attribute))) {
            object.set(attribute, this.value);
        }

    }

});

module.exports = DefaultValueValidator;