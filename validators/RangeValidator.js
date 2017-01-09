/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const ApplicationException = require('../exceptions/ApplicationException');
const _isArray = require('lodash/isArray');
const _each = require('lodash/each');
const Validator = require('./Validator');

class RangeValidator extends Validator {

    preInit() {
        this.not = false;
        this.strict = false;
        this.range = null;

        super.preInit(...arguments);
    }

    init() {
        super.init();

        if (!_isArray(this.range)) {
            throw new ApplicationException('The `range` property must be set.');
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
        var isFined = false;

        _each(this.range, item => {
            if (this.strict && value === item) {
                isFined = true;
                return false;
            }

            if (!this.strict && value == item) {
                isFined = true;
                return false;
            }
        });

        return !this.not ? isFined : !isFined;
    }

}
module.exports = RangeValidator;