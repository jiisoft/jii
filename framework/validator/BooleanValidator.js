/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

/**
 * @class Jii.validator.BooleanValidator
 * @extends Jii.validator.Validator
 */
Jii.defineClass('Jii.validator.BooleanValidator', {

	__extends: Jii.validator.Validator,

    trueValue: '1',

    falseValue: '0',

    strict: false,

    init: function() {
        this.__super();
        if (this.message === null) {
            this.message = ''; // @todo
        }
    },

    validateAttribute: function(object, attribute) {
        var value = object.get(attribute);
        if (!this.validateValue(value)) {
            this.addError(object, attribute, this.message, {
                trueValue: this.trueValue,
                falseValue: this.falseValue
            });
        }
    },

    validateValue: function(value) {
        if (this.strict) {
            return value === this.trueValue || value === this.falseValue;
        } else {
            return value == this.trueValue || value == this.falseValue;
        }
    }

});
