/**
 *
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Object = require('../base/Object');

/**
 * Expression represents a DB expression that does not need escaping or quoting.
 * When an Expression object is embedded within a SQL statement or fragment,
 * it will be replaced with the [[expression]] property value without any
 * DB escaping or quoting. For example,
 *
 * ~~~
 * expression = new Expression('NOW()');
 * sql = 'SELECT ' . expression;  // SELECT NOW()
 * ~~~
 *
 * An expression can also be bound with parameters specified via [[params]].
 *
 * @class Jii.data.Expression
 * @extends Jii.base.Object
 */
var Expression = Jii.defineClass('Jii.data.Expression', /** @lends Jii.data.Expression.prototype */{

	__extends: Object,

	/**
	 * @type {string} the DB expression
	 */
	expression: null,

	/**
	 * @type {object} list of parameters that should be bound for this expression.
	 * The keys are placeholders appearing in [[expression]] and the values
	 * are the corresponding parameter values.
	 */
	params: null,

	/**
	 * Constructor.
	 * @param {string} expression the DB expression
	 * @param {object} params parameters
	 * @param {[]} config name-value pairs that will be used to initialize the object properties
	 * @constructor
	 */
	constructor(expression, params, config) {
		params = params || [];
		config = config || [];

		this.expression = expression;
		this.params = params;
		this.__super(config);
	},

	/**
	 * String magic method
	 * @returns {string} the DB expression
	 */
	toString() {
		return this.expression;
	}

});

module.exports = Expression;