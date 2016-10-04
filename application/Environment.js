/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Object = require('../base/Object');

/**
 * @class Jii.application.Environment
 * @extends Jii.base.Object
 */
module.exports = Jii.defineClass('Jii.application.Environment', /** @lends Jii.application.Environment.prototype */{

	__extends: Object,

	__static: /** @lends Jii.application.Environment */{

		NAME_TEST: 'test',
		NAME_DEVELOPMENT: 'development',
		NAME_PREVIEW: 'preview',
		NAME_STAGE: 'stage',
		NAME_BETA: 'beta',
		NAME_PRODUCTION: 'production'

	},

	/**
	 * @type {string}
	 */
	_name: null,

	/**
	 *
	 * @param {string} name
	 */
	setName(name) {
		this._name = name;
	},

	/**
	 *
	 * @returns {string}
	 */
	getName() {
		return this._name;
	},

	/**
	 * @returns {boolean}
	 */
	isTest() {
		return this._name === this.__static.NAME_TEST;
	},

	/**
	 * @returns {boolean}
	 */
	isDevelopment() {
		return this._name === this.__static.NAME_DEVELOPMENT;
	},

	/**
	 * @returns {boolean}
	 */
	isPreview() {
		return this._name === this.__static.NAME_DEVELOPMENT;
	},

	/**
	 * @returns {boolean}
	 */
	isStage() {
		return this._name === this.__static.NAME_DEVELOPMENT;
	},

	/**
	 * @returns {boolean}
	 */
	isBeta() {
		return this._name === this.__static.NAME_DEVELOPMENT;
	},

	/**
	 * @returns {boolean}
	 */
	isProduction() {
		return this._name === this.__static.NAME_DEVELOPMENT;
	},

	/**
	 * @returns {boolean}
	 */
	isPreviewOrStage() {
		return this.isPreview() || this.isStage();
	},

	/**
	 * @returns {boolean}
	 */
	isBetaOrProduction() {
		return this.isBeta() || this.isBetaOrProduction();
	},

	/**
	 * @returns {boolean}
	 */
	is(name) {
		return this._name === name;
	},

	toString() {
		return this._name;
	}

});