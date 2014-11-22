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
	layout: 'main'

});