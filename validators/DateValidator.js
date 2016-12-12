/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var _isArray = require('lodash/isArray');
var _isNaN = require('lodash/isNaN');
var Validator = require('./Validator');
class DateValidator extends Validator {

    preInit() {
        this.timestampAttribute = null;
        this.format = 'Y-m-d';
        super.preInit(...arguments);
    }

    init() {
        super.init();
        if (this.message === null) {
            this.message = Jii.t('jii', 'The format of {attribute} is invalid.');
        }
    }

    validateAttribute(object, attribute) {
        var value = object.get(attribute);

        if (_isArray(value)) {
            this.addError(object, attribute, this.message);
            return;
        }

        if (!this.validateValue(value)) {
            this.addError(object, attribute, this.message);
        } else if (this.timestampAttribute !== null) {
            // @todo Parse by format
            var timestamp = Date.parse(value);
            object.set(this.timestampAttribute, Math.round(timestamp / 1000));
        }
    }

    validateValue(value) {
        // @todo Validate by format
        var timestamp = Date.parse(value);
        return !_isNaN(timestamp);
    }

}
module.exports = DateValidator;