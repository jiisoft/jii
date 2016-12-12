/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var ApplicationException = require('../exceptions/ApplicationException');
var _isArray = require('lodash/isArray');
var Validator = require('./Validator');
class CompareValidator extends Validator {

    preInit() {
        this.operator = '==';
        this.compareValue = null;
        this.compareAttribute = null;
        super.preInit(...arguments);
    }

    init() {
        super.init();
        if (this.message === null) {
            this.message = ''; // @todo
        }
    }

    validateAttribute(object, attribute) {
        var compareLabel = null;
        var value = object.get(attribute);

        if (_isArray(value)) {
            this.addError(object, attribute, Jii.t('{attribute} is invalid.'));
            return;
        }

        if (this.compareValue === null) {
            if (this.compareAttribute === null) {
                this.compareAttribute = attribute + '_repeat';
            }
            compareLabel = object.getAttributeLabel(this.compareAttribute);
            this.compareValue = object.get(this.compareAttribute);
        } else {
            compareLabel = this.compareValue;
        }

        if (!this.validateValue(value)) {
            this.addError(object, attribute, this.message, {
                compareAttribute: compareLabel,
                compareValue: this.compareValue
            });
        }
    }

    validateValue(value) {
        if (!this.compareValue) {
            throw new ApplicationException('CompareValidator::compareValue must be set.');
        }

        switch (this.operator) {
            case '==':
                return this.compareValue == value;
            case '===':
                return this.compareValue === value;
            case '!=':
                return this.compareValue != value;
            case '!==':
                return this.compareValue !== value;
            case '>':
                return this.compareValue > value;
            case '>=':
                return this.compareValue >= value;
            case '<':
                return this.compareValue < value;
            case '<=':
                return this.compareValue <= value;
        }
        return false;
    }

}
module.exports = CompareValidator;