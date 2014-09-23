/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

/**
 * @class Jii.validator.RangeValidator
 * @extends Jii.validator.Validator
 */
Jii.defineClass('Jii.validator.RangeValidator', {

	__extends: Jii.validator.Validator,

	range: null,

    strict: false,

    not: false,

    init: function() {
        this.__super();

        if (!_.isArray(this.range)) {
            throw new Jii.exceptions.ApplicationException('The `range` property must be set.');
        }

        if (this.message === null) {
            this.message = Jii.t('jii', '{attribute} is invalid.');
        }
    },

    validateAttribute: function(object, attribute) {
        var value = object.get(attribute);
        if (!this.validateValue(value)) {
            this.addError(object, attribute, this.message);
        }
    },

    validateValue: function(value) {
        var isFined = false;

        _.each(this.range, _.bind(function(item) {
            if (this.strict && value === item) {
                isFined = true;
                return false;
            }

            if (!this.strict && value == item) {
                isFined = true;
                return false;
            }
        }, this));

        return !this.not ? isFined : !isFined;
    }

});
