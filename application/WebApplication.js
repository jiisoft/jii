/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../Jii');
var Application = require('../base/Application');

/**
 * @class Jii.application.WebApplication
 * @extends Jii.base.Application
 */
module.exports = Jii.defineClass('Jii.application.WebApplication', /** @lends Jii.application.WebApplication.prototype */{

	__extends: Application,

	/**
	 * @var {string|boolean} the layout that should be applied for views in this application. Defaults to 'main'.
	 * If this is false, layout will be disabled.
	 */
	layout: 'main',

    defaultRoute: 'site',

	_preInit(config) {
		this.__super(config);

		// Set default webroot
		this.setWebPath(config.webPath || this.getBasePath() + '/web');
		this.setWebUrl(config.webUrl || '/');
	},

	/**
	 * @return {String}
	 */
	getWebPath() {
		return Jii.getAlias('@webroot');
	},

	/**
	 * @param  {String} path
	 */
	setWebPath(path) {
		Jii.setAlias('@webroot', path);
	},

	/**
	 * @return {String}
	 */
	getWebUrl() {
		return Jii.getAlias('@web');
	},

	/**
	 * @param  {String} path
	 */
	setWebUrl(path) {
		Jii.setAlias('@web', path);
	}

});