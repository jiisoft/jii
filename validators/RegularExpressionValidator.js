/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const ApplicationException = require('../exceptions/ApplicationException');
const _isRegExp = require('lodash/isRegExp');
const Validator = require('./Validator');

class RegularExpressionValidator extends Validator {

    preInit() {
        this.not = false;
        this.pattern = null;

        super.preInit(...arguments);
    }

    init() {
        super.init();

        if (!_isRegExp(this.pattern)) {
            throw new ApplicationException('The `pattern` property must be set.');
        }

        if (this.message === null) {
            this.message = Jii.t('jii', '{attribute} is invalid.');
        }
    }

    validateAttribute(object, attribute) {
        var value = object.get(attribute);
        if (!this.validateValue(value)) {
            this.addError(object, attribute, this.message);
        }
    }

    validateValue(value) {
        var isMatch = this.pattern.test(value);
        return !this.not ? isMatch : !isMatch;
    }

}
module.exports = RegularExpressionValidator;