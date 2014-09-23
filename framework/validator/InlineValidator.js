/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

/**
 * @class Jii.validator.InlineValidator
 * @extends Jii.validator.Validator
 */
Jii.defineClass('Jii.validator.InlineValidator', {

	__extends: Jii.validator.Validator,

	method: null,

    params: null,

    init: function() {
        this.__super();
        if (this.message === null) {
            this.message = ''; // @todo
        }
    },

    validateAttribute: function(object, attribute) {
        var method = object[this.method];

        if (!_.isFunction(method)) {
            throw new Jii.exceptions.ApplicationException('Not find method `' + this.method + '` in model `' + object.debugClassName + '`.');
        }

        return method.call(object, attribute, this.params || {});
    }

});
