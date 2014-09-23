/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

/**
 * @class Jii.app.Module
 * @extends Jii.base.Context
 */
Jii.defineClass('Jii.base.Module', {

	__extends: Jii.base.Context,

	/**
	 * @type {string}
	 */
	id: null,

	/**
	 * The parent module of this module. Null if this module does not have a parent.
	 * @type {Jii.base.Module}
	 */
	module: null,

	/**
	 * Mapping from controller ID to controller configurations.
	 * Each name-value pair specifies the configuration of a single controller.
	 * A controller configuration can be either a string or an array.
	 * If the former, the string should be the fully qualified class name of the controller.
	 * If the latter, the array must contain a 'class' element which specifies
	 * the controller's fully qualified class name, and the rest of the name-value pairs
	 * in the array are used to initialize the corresponding controller properties. For example,
	 *
	 * ~~~
	 * {
     *   account: 'app.controllers.UserController',
     *   article: {
     *      className: 'app.controllers.PostController',
     *      pageTitle: 'something new'
     *   }
     * }
	 * ~~~
	 * @type {array}
	 */
	controllerMap: {},

	/**
	 * String the namespace that controller classes are in. If not set,
	 * it will use the "controllers" sub-namespace under the namespace of this module.
	 * For example, if the namespace of this module is "foo\bar", then the default
	 * controller namespace would be "foo\bar\controllers".
	 * @type {string}
	 */
	controllerNamespace: null,

	/**
	 * The default route of this module. Defaults to 'default'.
	 * The route may consist of child module ID, controller ID, and/or action ID.
	 * For example, `help`, `post/create`, `admin/post/create`.
	 * If action ID is not given, it will take the default value as specified in defaultAction.
	 * @type {string}
	 */
	defaultRoute: 'default',

	/**
	 * The layout that should be applied for views within this module. This refers to a view name
	 * relative to [[layoutPath]]. If this is not set, it means the layout value of the [[module|parent module]]
	 * will be taken. If this is false, layout will be disabled within this module.
	 * @type {string|boolean}
	 */
	layout: null,

	/**
	 * @type {object}
	 */
	_modules: null,

	/**
	 * @constructor
	 */
	constructor: function (id, moduleObject, config) {
		this.id = id;
		this.module = moduleObject;
		this._modules = {};

		this.__super(config);
	},

	init: function () {
		if (this.controllerNamespace === null) {
			var index = _.lastIndexOf(this.className(), '.');
			this.controllerNamespace = this.className().substr(0, index);
		}
	},

	getUniqueId: function () {
		if (this.module) {
			var id = this.module.getUniqueId() + '/' + this.id;
			return _.string.ltrim(id, '/');
		}
		return this.id;
	},

	/**
	 * The root directory of the module.
	 * @type {string}
	 */
	_basePath: null,

	/**
	 * Returns the root directory of the module.
	 * It defaults to the directory containing the module class file.
	 * @return {string} the root directory of the module.
	 */
	getBasePath: function () {
		if (this._basePath === null) {
			this._basePath = Jii.getAlias('@' + this.className().replace(/\.[^.]+$/, ''))
		}

		return this._basePath;
	},

	/**
	 * Sets the root directory of the module.
	 * This method can only be invoked at the beginning of the constructor.
	 * @param  {string} path the root directory of the module. This can be either a directory name or a path alias.
	 */
	setBasePath: function (path) {
		this._basePath = Jii.getAlias(path);
	},

	/**
	 * Returns the directory that contains the controller classes according to [[controllerNamespace]].
	 * Note that in order for this method to return a value, you must define
	 * an alias for the root namespace of [[controllerNamespace]].
	 * @return {string} the directory that contains the controller classes.
	 */
	getControllerPath: function () {
		return Jii.getAlias('@' + this.controllerNamespace.replace('.', '/'));
	},

	/**
	 * The root directory that contains view files for this module
	 * @type {string}
	 */
	_viewPath: null,

	/**
	 * Returns the directory that contains the view files for this module.
	 * @return {string} the root directory of view files. Defaults to "[[basePath]]/view".
	 */
	getViewPath: function () {
		if (this._viewPath === null) {
			this._viewPath = this.getBasePath() + '/views';
		}
		return this._viewPath;
	},

	/**
	 * Sets the directory that contains the view files.
	 * @param {string} path the root directory of view files.
	 */
	setViewPath: function (path) {
		this._viewPath = Jii.getAlias(path);
	},

	/**
	 * The root directory that contains layout view files for this module.
	 * @type {string}
	 */
	_layoutPath: null,

	/**
	 * Returns the directory that contains layout view files for this module.
	 * @return {string} the root directory of layout files. Defaults to "[[viewPath]]/layouts".
	 */
	getLayoutPath: function () {
		if (this._layoutPath === null) {
			this._layoutPath = this.getViewPath() + '/layouts';
		}
		return this._layoutPath;
	},

	/**
	 * Sets the directory that contains the layout files.
	 * @param  {string} path the root directory of layout files.
	 */
	setLayoutPath: function (path) {
		this._layoutPath = Jii.getAlias(path);
	},

	/**
	 * Checks whether the child module of the specified ID exists.
	 * This method supports checking the existence of both child and grand child modules.
	 * @param {string} id module ID. For grand child modules, use ID path relative to this module (e.g. `admin/content`).
	 * @return {boolean} whether the named module exists. Both loaded and unloaded modules
	 * are considered.
	 */
	hasModule: function (id) {
		var index = _.indexOf(id, '.');
		if (index !== -1) {
			var moduleId = id.substr(0, index);
			var childModuleId = id.substr(index + 1);

			// Check sub-module
			var moduleObject = this.getModule(moduleId);
			return moduleObject !== null ? moduleObject.hasModule(childModuleId) : false;
		}

		return _.has(this._modules[id]);
	},

	/**
	 * Retrieves the child module of the specified ID.
	 * This method supports retrieving both child modules and grand child modules.
	 * @param {string} id module ID (case-sensitive). To retrieve grand child modules,
	 * use ID path relative to this module (e.g. `admin/content`).
	 * @param {boolean} [load] whether to load the module if it is not yet loaded.
	 * @return {Jii.base.Module} the module instance, null if the module does not exist.
	 */
	getModule: function (id, load) {
		if (_.isUndefined(load)) {
			load = true;
		}

		// Get sub-module
		var index = _.indexOf(id, '.');
		if (index !== -1) {
			var moduleId = id.substr(0, index);
			var childModuleId = id.substr(index + 1);

			var moduleObject = this.getModule(moduleId);
			return moduleObject !== null ? moduleObject.getModule(childModuleId) : null;
		}

		return this._modules[id] || null;
	},

	/**
	 * Adds a sub-module to this module.
	 * @param {string} id module ID
	 * @param {Jii.base.Module|array|null} moduleObject the sub-module to be added to this module. This can
	 * be one of the followings:
	 *
	 * - a [[Jii.base.Module]] object
	 * - a configuration array: when [[getModule()]] is called initially, the array
	 *   will be used to instantiate the sub-module
	 * - null: the named sub-module will be removed from this module
	 */
	setModule: function (id, moduleObject) {
		if (moduleObject === null) {
			delete this._modules[id];
		} else {
			// Create module instance
			moduleObject = Jii.createObject(moduleObject, id, this);

			// Add link
			this._modules[id] = moduleObject;
		}
	},

	/**
	 * Returns the sub-modules in this module.
	 * @return {Jii.base.Module[]} the modules (indexed by their IDs)
	 */
	getModules: function () {
		return this._modules;
	},

	/**
	 * Registers sub-modules in the current module.
	 *
	 * Each sub-module should be specified as a name-value pair, where
	 * name refers to the ID of the module and value the module or a configuration
	 * array that can be used to create the module. In the latter case, [[Jii.createObject()]]
	 * will be used to create the module.
	 *
	 * If a new sub-module has the same ID as an existing one, the existing one will be overwritten silently.
	 *
	 * The following is an example for registering two sub-modules:
	 *
	 * ~~~
	 * [
	 *     'comment' => [
	 *         'class' => 'app\modules\comment\CommentModule',
	 *         'db' => 'db',
	 *     ],
	 *     'booking' => ['class' => 'app\modules\booking\BookingModule'],
	 * ]
	 * ~~~
	 *
	 * @param {object} modules modules (id => module configuration or instances)
	 */
	setModules: function (modules) {
		_.each(modules, _.bind(function (moduleObject, id) {
			this._modules[id] = moduleObject;
		}, this));
	},

	/**
	 * Runs a controller action specified by a route.
	 * This method parses the specified route and creates the corresponding child module(s), controller and action
	 * instances. It then calls [[Jii.controller.BaseController::runAction()]] to run the action with the given parameters.
	 * If the route is empty, the method will use [[defaultRoute]].
	 * @param {string} route the route that specifies the action.
	 * @param {Jii.base.Context} context
	 * @return {Promise} the result of the action.
	 * @throws {Jii.exceptions.InvalidRouteException} if the requested route cannot be resolved into an action successfully
	 */
	runAction: function (route, context) {
		var parts = this.createController(route);
		if (parts !== null) {
			/** @type {Jii.controller.BaseController} */
			var controller = parts[0];
			var actionId = parts[1];

			return controller.runAction(actionId, context);
		}

		var id = this.getUniqueId();
		var requestName = id ? id + '/' + route : route;
		//throw new Jii.exceptions.InvalidRouteException('Unable to resolve the request `' + requestName + '`.');
		//Jii.app.logger.info('Unable to resolve the request `' + requestName + '`.');
	},

	/**
	 * Creates a controller instance based on the controller ID.
	 *
	 * The controller is created within this module. The method first attempts to
	 * create the controller based on the [[controllerMap]] of the module.
	 *
	 * @param {string} route the route consisting of module, controller and action IDs.
	 * @return {array|null} If the controller is created successfully, it will be returned together
	 * with the requested action ID. Otherwise false will be returned.
	 * @throws {Jii.exceptions.InvalidConfigException} if the controller class and its file do not match.
	 */
	createController: function (route) {
		if (route === '') {
			route = this.defaultRoute;
		}

		var id;
		var controller = null;
		var index = route.indexOf('/');

		if (index !== -1) {
			id = route.substr(0, index);
			route = route.substr(index + 1);
		} else {
			id = route;
			route = '';
		}

		var moduleObject = this.getModule(id);
		if (moduleObject !== null) {
			return moduleObject.createController(route);
		}

		if (_.has(this.controllerMap, id)) {
			return Jii.createObject(this.controllerMap[id], id, this);
		} else if (/^[a-z0-9\\-_]+$/.test(id)) {

			var className = id.charAt(0).toUpperCase() + id.slice(1);
			className = className.replace('-', '') + 'Controller';
			className = this.controllerNamespace + '.' + className;

			var controllerClass = Jii.namespace(className);
			if (_.isFunction(controllerClass)) {
				controller = new controllerClass(id, this);

				if (!(controller instanceof Jii.controller.BaseController)) {
					throw new Jii.exceptions.InvalidConfigException("Controller class must extend from Jii.controller.BaseController.");
				}
			}
		}

		return controller !== null ? [controller, route] : null;
	},

	/**
	 * This method is invoked right before an action of this module is to be executed (after all possible filters.)
	 * You may override this method to do last-minute preparation for the action.
	 * Make sure you call the parent implementation so that the relevant event is triggered.
	 * @param {Jii.controller.BaseAction} action the action to be executed.
	 * @return {boolean} whether the action should continue to be executed.
	 */
	beforeAction: function (action) {
		return true;
	},

	/**
	 * This method is invoked right after an action of this module has been executed.
	 * You may override this method to do some postprocessing for the action.
	 * Make sure you call the parent implementation so that the relevant event is triggered.
	 * @param {Jii.controller.BaseAction} action the action just executed.
	 */
	afterAction: function (action) {
	}

});
