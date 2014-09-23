/**
 * Console application class.
 *
 * @author Dmitriy Yurchenko <evildev@evildev.ru>
 * @license MIT
 */

'use strict';

/**
 * @class Jii.application.WebApplication
 * @extends Jii.base.Application
 */
Jii.defineClass('Jii.application.WebApplication', {

	__extends: Jii.base.Application,

	/**
	 * @var {string|boolean} the layout that should be applied for views in this application. Defaults to 'main'.
	 * If this is false, layout will be disabled.
	 */
	layout: 'main'

});