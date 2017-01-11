/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const Validator = require('./Validator');
const _isArray = require('lodash/isArray');
const _intersection = require('lodash/intersection');
const _map = require('lodash/map');
class DefaultValueValidator extends Validator {

    preInit() {
        this.skipOnEmpty = false;
        this.value = null;

        super.preInit(...arguments);
    }

    init() {
        super.init();
        if (this.message === null) {
            this.message = ''; // @todo
        }
    }

    validateAttribute(object, attribute) {
        if (this.isEmpty(object.get(attribute))) {
            object.set(attribute, this.value);
        }
    }

    validate(object, attributes) {
        attributes = _isArray(attributes) ? _intersection(this.attributes, attributes) : this.attributes;

        var promises = _map(attributes, attribute => {
            if (this.skipOnError && object.hasErrors(attribute)) {
                return;
            }

            return this.validateAttribute(object, attribute);
        });

        return Promise.all(promises);
    }

}
module.exports = DefaultValueValidator;