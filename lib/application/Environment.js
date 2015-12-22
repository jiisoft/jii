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

require('../base/Application');

/**
 * @class Jii.application.Environment
 * @extends Jii.base.Object
 */
Jii.defineClass('Jii.application.Environment', /** @lends Jii.application.Environment.prototype */{

	__extends: 'Jii.base.Object',

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
	setName: function(name) {
		this._name = name;
	},

	/**
	 *
	 * @returns {string}
	 */
	getName: function() {
		return this._name;
	},

	/**
	 * @returns {boolean}
	 */
	isTest: function() {
		return this._name === this.__static.NAME_TEST;
	},

	/**
	 * @returns {boolean}
	 */
	isDevelopment: function() {
		return this._name === this.__static.NAME_DEVELOPMENT;
	},

	/**
	 * @returns {boolean}
	 */
	isPreview: function() {
		return this._name === this.__static.NAME_DEVELOPMENT;
	},

	/**
	 * @returns {boolean}
	 */
	isStage: function() {
		return this._name === this.__static.NAME_DEVELOPMENT;
	},

	/**
	 * @returns {boolean}
	 */
	isBeta: function() {
		return this._name === this.__static.NAME_DEVELOPMENT;
	},

	/**
	 * @returns {boolean}
	 */
	isProduction: function() {
		return this._name === this.__static.NAME_DEVELOPMENT;
	},

	/**
	 * @returns {boolean}
	 */
	isPreviewOrStage: function() {
		return this.isPreview() || this.isStage();
	},

	/**
	 * @returns {boolean}
	 */
	isBetaOrProduction: function() {
		return this.isBeta() || this.isBetaOrProduction();
	},

	/**
	 * @returns {boolean}
	 */
	is: function(name) {
		return this._name === name;
	},

	toString: function() {
		return this._name;
	}

});