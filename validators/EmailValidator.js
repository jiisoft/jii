/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var _isString = require('lodash/isString');
var Validator = require('./Validator');
class EmailValidator extends Validator {

    preInit() {
        this.allowName = false;
        this.fullPattern = /^[^@]*<[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?>$/;
        this.pattern = /^[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
        super.preInit(...arguments);
    }

    init() {
        super.init();
        if (this.message === null) {
            this.message = Jii.t('jii', '{attribute} is not a valid email address.');
        }
    }

    validateAttribute(object, attribute) {
        var value = object.get(attribute);
        if (!this.validateValue(value)) {
            this.addError(object, attribute, this.message);
        }
    }

    validateValue(value) {
        if (!_isString(value) || value.length > 320) {
            return false;
        }

        return this.pattern.test(value) || this.allowName && this.fullPattern.test(value);
    }

}
module.exports = EmailValidator;