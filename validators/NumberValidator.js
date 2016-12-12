/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var _isArray = require('lodash/isArray');
var Validator = require('./Validator');
class NumberValidator extends Validator {

    preInit() {
        this.numberPattern = /^\s*[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?\s*$/;
        this.integerPattern = /^\s*[+-]?\d+\s*$/;
        this.tooSmall = null;
        this.tooBig = null;
        this.min = null;
        this.max = null;
        this.integerOnly = false;
        super.preInit(...arguments);
    }

    init() {
        super.init();

        if (this.message === null) {
            this.message = this.integerOnly ? Jii.t('jii', '{attribute} must be an integer.') : Jii.t('jii', '{attribute} must be an number.');
        }
        if (this.min !== null && this.tooSmall === null) {
            this.tooSmall = Jii.t('jii', '{attribute} must be no less than {min}.');
        }
        if (this.max !== null && this.tooBig === null) {
            this.tooBig = Jii.t('jii', '{attribute} must be no greater than {max}.');
        }
    }

    validateAttribute(object, attribute) {
        var value = object.get(attribute);

        if (_isArray(value)) {
            this.addError(object, attribute, Jii.t('{attribute} is invalid.'));
            return;
        }

        var pattern = this.integerOnly ? this.integerPattern : this.numberPattern;
        if (!pattern.test(value)) {
            this.addError(object, attribute, this.message);
        }

        if (this.min !== null && value < this.min) {
            this.addError(object, attribute, this.tooSmall, {
                min: this.min
            });
        }
        if (this.max !== null && value > this.max) {
            this.addError(object, attribute, this.tooBig, {
                max: this.max
            });
        }
    }

    validateValue(value) {
        var pattern = this.integerOnly ? this.integerPattern : this.numberPattern;
        return pattern.test(value) && (this.min === null || value >= this.min) && (this.max === null || value <= this.max);
    }

}
module.exports = NumberValidator;