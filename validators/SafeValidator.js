/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const Validator = require('./Validator');

class SafeValidator extends Validator {

    validateAttribute(object, attribute) {
    }

}
module.exports = SafeValidator;