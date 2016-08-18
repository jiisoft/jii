/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('../Jii');

/**
 *
 * @class Jii.base.Object
 */
Jii.defineClass('Jii.base.Object', /** @lends Jii.base.Object.prototype */{

	__static: /** @lends Jii.base.Object */{

		/**
		 * Return full class name with namespace
		 * @returns {string}
		 */
		className() {
			return this.__className;
		},

		/**
		 * Return extended class name with namespace
		 * @returns {string}
		 */
		parentClassName() {
			return this.__parentClassName;
		}

	},

	/**
	 * @param {object} [config]
	 * @constructor
	 */
	constructor(config) {
		this.__super.apply(this, arguments);

		// Apply configuration to instance
		if (Jii._.isObject(config)) {
			Jii.configure(this, config);
		}

		// Run custom init method
		this.init();
	},

	/**
	 * Customized initialize method
	 */
	init() {
	},

	/**
	 * Method defined jsdoc for hide errors in IDE
	 * @param {...*} [params]
	 * @protected
	 */
	__super(params) {
	},

	/**
	 * Return full class name with namespace
	 * @returns {string}
	 */
	className() {
		return this.__className;
	},

	/**
	 * Return extended class name with namespace
	 * @returns {string}
	 */
	parentClassName() {
		return this.__parentClassName;
	}

});
