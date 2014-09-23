/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

/**
 * @class Jii.validator.EmailValidator
 * @extends Jii.validator.Validator
 */
Jii.defineClass('Jii.validator.EmailValidator', {

	__extends: Jii.validator.Validator,

	pattern: /^[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/,

    fullPattern: /^[^@]*<[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?>$/,

    allowName: false,

    init: function () {
        this.__super();
        if (this.message === null) {
            this.message = Jii.t('jii', '{attribute} is not a valid email address.');
        }
    },

    validateAttribute: function (object, attribute) {
        var value = object.get(attribute);
        if (!this.validateValue(value)) {
            this.addError(object, attribute, this.message);
        }
    },

    validateValue: function (value) {
        if (!_.isString(value) || value.length > 320) {
            return false;
        }

        return this.pattern.test(value) || (this.allowName && this.fullPattern.test(value));
    }

});
