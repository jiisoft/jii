/**
 * Console application class.
 *
 * @author Dmitriy Yurchenko <evildev@evildev.ru>
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
 * @class Jii.application.WebApplication
 * @extends Jii.base.Application
 */
Jii.defineClass('Jii.application.WebApplication', /** @lends Jii.application.WebApplication.prototype */{

	__extends: Jii.base.Application,

	/**
	 * @var {string|boolean} the layout that should be applied for views in this application. Defaults to 'main'.
	 * If this is false, layout will be disabled.
	 */
	layout: 'main',

	_preInit: function(config) {
		this.__super(config);

		// Set default webroot
		this.setWebPath(config.webPath || this.getBasePath() + '/web');
		this.setWebUrl(config.webUrl || '/');
	},

	/**
	 * @return {String}
	 */
	getWebPath: function () {
		return Jii.getAlias('@webroot');
	},

	/**
	 * @param  {String} path
	 */
	setWebPath: function (path) {
		Jii.setAlias('@webroot', path);
	},

	/**
	 * @return {String}
	 */
	getWebUrl: function () {
		return Jii.getAlias('@web');
	},

	/**
	 * @param  {String} path
	 */
	setWebUrl: function (path) {
		Jii.setAlias('@web', path);
	}

});