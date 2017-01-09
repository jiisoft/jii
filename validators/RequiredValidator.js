/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const Validator = require('./Validator');

class RequiredValidator extends Validator {

    preInit() {
        super.preInit(...arguments);

        this.strict = false;
        this.requiredValue = null;
        this.skipOnEmpty = false;
    }

    init() {
        super.init();
        if (this.message === null) {
            this.message = this.requiredValue === null ? Jii.t('jii', '{attribute} cannot be blank.') : Jii.t('jii', '{attribute} must be `{requiredValue}`.');
        }
    }

    validateAttribute(object, attribute) {
        var value = object.get(attribute);
        if (!this.validateValue(value)) {
            var params = this.requiredValue !== null ? {
                requiredValue: this.requiredValue
            } : {};
            this.addError(object, attribute, this.message, params);
        }
    }

    validateValue(value) {
        if (this.requiredValue === null) {
            return this.strict ? value !== null : !this.isEmpty(value, true);
        }
        return this.strict ? value !== this.requiredValue : value != this.requiredValue;
    }

}
module.exports = RequiredValidator;