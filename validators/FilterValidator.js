/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const ApplicationException = require('../exceptions/ApplicationException');
const Validator = require('./Validator');

class FilterValidator extends Validator {

    preInit() {
        this.skipOnEmpty = false;
        this.filter = null;

        super.preInit(...arguments);
    }

    init() {
        super.init();
        if (this.filter === null) {
            throw new ApplicationException('The `filter` property must be set.');
        }
    }

    validateAttribute(object, attribute) {
        object.set(attribute, this.filter.call(object, object.get(attribute)));
    }

}
module.exports = FilterValidator;