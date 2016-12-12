/**
 *
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var Object = require('../base/Object');
class Expression extends Object {

    preInit(expression, params, config) {
        params = params || [];
        config = config || [];
        /**
     * @type {string} the DB expression
     */
        this.expression = expression;
        /**
     * @type {object} list of parameters that should be bound for this expression.
     * The keys are placeholders appearing in [[expression]] and the values
     * are the corresponding parameter values.
     */
        this.params = params;
        super.preInit(config);
    }

    /**
     * String magic method
     * @returns {string} the DB expression
     */
    toString() {
        return this.expression;
    }

}
module.exports = Expression;