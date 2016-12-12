/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var ApplicationException = require('../exceptions/ApplicationException');
var _isFunction = require('lodash/isFunction');
var Validator = require('./Validator');
class InlineValidator extends Validator {

    preInit() {
        this.params = null;
        this.method = null;
        super.preInit(...arguments);
    }

    init() {
        super.init();
        if (this.message === null) {
            this.message = ''; // @todo
        }
    }

    validateAttribute(object, attribute) {
        var method = object[this.method];

        if (!_isFunction(method)) {
            throw new ApplicationException('Not find method `' + this.method + '` in model `' + object.debugClassName + '`.');
        }

        return method.call(object, attribute, this.params || {});
    }

}
module.exports = InlineValidator;