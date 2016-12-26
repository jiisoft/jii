/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Validator = require('./Validator');

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

}
module.exports = DefaultValueValidator;