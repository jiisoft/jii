/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var ApplicationException = require('../exceptions/ApplicationException');
var Validator = require('./Validator');

/**
 * @class Jii.validators.FilterValidator
 * @extends Jii.validators.Validator
 */
var FilterValidator = Jii.defineClass('Jii.validators.FilterValidator', /** @lends Jii.validators.FilterValidator.prototype */{

    __extends: Validator,

	filter: null,

    skipOnEmpty: false,

    init() {
        this.__super();
        if (this.filter === null) {
            throw new ApplicationException('The `filter` property must be set.');
        }
    },

    validateAttribute(object, attribute) {
        object.set(attribute, this.filter.call(object, object.get(attribute)));
    }

});

module.exports = FilterValidator;