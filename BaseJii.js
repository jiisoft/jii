/**
 * Jii — Full-Stack JavaScript Framework based on PHP Yii 2 Framework architecture.
 *
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var neatness = require('neatness');
var _isString = require('lodash/isString');
var _extend = require('lodash/extend');

var Neatness = neatness.newContext();
Neatness.defineClass('Jii', {});

var Jii = Neatness.namespace('Jii');

/**
 * @class BaseJii
 */
_extend(Jii, /** @lends BaseJii */{

	/**
	 * True, if running in node js
	 * @type {boolean}
	 */
	isNode: false,

	/**
	 * @type {boolean}
	 */
	debug: true,

	/**
	 * Returns framework version
	 * @returns {string}
	 */
	getVersion() {
		return require('./package.json').version;
	},

	/**
	 * Get class by full namespace.
	 * @param {string} name
	 * @returns {function|object}
	 */
	namespace(name) {
		if (!process.env.JII_NO_NAMESPACE && Jii.helpers && Jii.helpers.ClassLoader) {
			Jii.helpers.ClassLoader.load(name);
		}
		if (process.env.JII_NO_NAMESPACE && _isString(name)) {
			throw new Error(`You are used mode without namespaces, but Jii.namespace detect string class name "${name}"`);
		}
		return _isString(name) ? Neatness.namespace.apply(Neatness, arguments) : name;
	},

	/**
	 * Move namespace to other object
	 * @param {object} newContext
	 * @param {boolean} [removeFromOld]
	 * @returns {*|Function|Object}
	 */
	namespaceMoveContext(newContext, removeFromOld) {
		return Neatness.moveContext.apply(Neatness, arguments);
	},

	/**
	 * Method for define class. Options object will be converter to class prototype.
	 * For set static properties and methods, set param `__static` as object with properties and methods.
	 * For extends from class, set `__extends` property as extended class (function). Example format:
	 *    {
		 *      __extends: Object,
		 *      __static: {
		 *          staticParam: 10,
		 *          MY_CONSTANT: 'constant',
		 *          normalizeName: function() {},
		 *      },
		 *      prototypeParam: 20,
		 *      getName: function() {}
		 * }
	 * @param {string} globalName
	 * @param {object} options
	 * @return {object}
	 */
	defineClass(globalName, options) {
		if (!process.env.JII_NO_NAMESPACE && Jii.helpers && Jii.helpers.ClassLoader) {
			Jii.helpers.ClassLoader.load(options.__extends);
		}
		if (process.env.JII_NO_NAMESPACE && _isString(options.__extends)) {
			throw new Error(`You are used mode without namespaces, but class ${globalName} has string extended class "${options.__extends}"`);
		}

		return Neatness.defineClass.apply(Neatness, arguments);
	}

});

// @todo Move to Errors module
process.on('unhandledRejection', (reason, promise) => {
    console.warn("Possibly Unhandled Rejection at: Promise ", promise, " reason: ", reason);
});

/**
 * @module Jii
 */
module.exports = Jii;