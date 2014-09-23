/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

/**
 * @class Jii.validator.FilterValidator
 * @extends Jii.validator.Validator
 */
Jii.defineClass('Jii.validator.FilterValidator', {

	__extends: Jii.validator.Validator,

	filter: null,

    skipOnEmpty: false,

    init: function() {
        this.__super();
        if (this.filter === null) {
            throw new Jii.exceptions.ApplicationException('The `filter` property must be set.');
        }
    },

    validateAttribute: function(object, attribute) {
        object.set(attribute, this.filter.call(object, object.get(attribute)));
    }

});
