/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

/**
 * @class Jii.validator.DefaultValueValidator
 * @extends Jii.validator.Validator
 */
Jii.defineClass('Jii.validator.DefaultValueValidator', {

	__extends: Jii.validator.Validator,

	value: null,

    skipOnEmpty: false,

    init: function() {
        this.__super();
        if (this.message === null) {
            this.message = ''; // @todo
        }
    },

    validateAttribute: function(object, attribute) {
        if (this.isEmpty(object.get(attribute))) {
            object.set(attribute, this.value);
        }

    }

});
