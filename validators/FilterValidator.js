/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var ApplicationException = require('../exceptions/ApplicationException');
var Validator = require('./Validator');
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