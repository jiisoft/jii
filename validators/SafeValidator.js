/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Validator = require('./Validator');

/**
 * @class Jii.validators.SafeValidator
 * @extends Jii.validators.Validator
 */
var SafeValidator = Jii.defineClass('Jii.validators.SafeValidator', /** @lends Jii.validators.SafeValidator.prototype */{

	__extends: Validator,

	validateAttribute(object, attribute) {
    }

});

module.exports = SafeValidator;