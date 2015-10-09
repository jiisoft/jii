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

require('./Context');

/**
 * @class Jii.base.Module
 * @extends Jii.base.Context
 */
Jii.defineClass('Jii.base.Module', /** @lends Jii.base.Module.prototype */{

	__extends: Jii.base.Context,

    __static: /** @lends Jii.base.Module */{

        /**
         * @event Jii.base.Module#beforeAction
         * @property {Jii.base.ActionEvent} event
         */
        EVENT_BEFORE_ACTION: 'beforeAction',

        /**
         * @event Jii.base.Module#afterAction
         * @property {Jii.base.ActionEvent} event
         */
        EVENT_AFTER_ACTION: 'afterAction'

    },

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
     * @type {{string: function}}
     */
    inlineActions: {},

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
	 * @type {object}
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
     * Stored controller instances
	 * @type {object}
	 */
    _controllers: {},

	/**
	 */
	constructor: function (id, moduleObject, config) {
		this.id = id;
		this.module = moduleObject;
		this._modules = {};

		this.__super(config);
	},

	init: function () {
		if (this.controllerNamespace === null) {
			var index = Jii._.lastIndexOf(this.className(), '.');
			this.controllerNamespace = this.className().substr(0, index);
		}
	},

    /**
     *
     * @returns {Promise}
     */
    start: function() {
        var promises = [];
        Jii._.each(this._components, function(component) {
            if (Jii._.isFunction(component.start)) {
                promises.push(component.start());
            }
        });
        return Promise.all(promises);
    },

    /**
     *
     * @returns {Promise}
     */
    stop: function() {
        var promises = [];
        Jii._.each(this._components, function(component) {
            if (Jii._.isFunction(component.stop)) {
                promises.push(component.stop());
            }
        });
        return Promise.all(promises);
    },

	getUniqueId: function () {
		if (this.module) {
			var id = this.module.getUniqueId() + '/' + this.id;
			return Jii._s.ltrim(id, '/');
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
		var index = Jii._.indexOf(id, '.');
		if (index !== -1) {
			var moduleId = id.substr(0, index);
			var childModuleId = id.substr(index + 1);

			// Check sub-module
			var moduleObject = this.getModule(moduleId);
			return moduleObject !== null ? moduleObject.hasModule(childModuleId) : false;
		}

		return Jii._.has(this._modules[id]);
	},

	/**
	 * Retrieves the child module of the specified ID.
	 * This method supports retrieving both child modules and grand child modules.
	 * @param {string} id module ID (case-sensitive). To retrieve grand child modules,
	 * use ID path relative to this module (e.g. `admin/content`).
	 * @return {Jii.base.Module} the module instance, null if the module does not exist.
	 */
	getModule: function (id) {
		// Get sub-module
		var index = Jii._.indexOf(id, '.');
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
            if (!(moduleObject instanceof Jii.base.Module)) {
                moduleObject = Jii.createObject(moduleObject, id, this);
            }

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
		Jii._.each(modules, Jii._.bind(function (moduleObject, id) {
			this.setModule(id, moduleObject);
		}, this));
	},

	/**
	 * Runs a controller action specified by a route.
	 * This method parses the specified route and creates the corresponding child module(s), controller and action
	 * instances. It then calls [[Jii.base.Controller::runAction()]] to run the action with the given parameters.
	 * If the route is empty, the method will use [[defaultRoute]].
	 * @param {string} route the route that specifies the action.
	 * @param {Jii.base.Context} context
	 * @return {Promise} the result of the action.
	 * @throws {Jii.exceptions.InvalidRouteException} if the requested route cannot be resolved into an action successfully
	 */
	runAction: function (route, context) {
        var routeParams = this._parseRoute(route);

        var fullRoute = routeParams.id + '/' + (routeParams.route || 'index');
        if (Jii._.has(this.inlineActions, fullRoute)) {
            var action = this.inlineActions[fullRoute] instanceof Jii.base.Action ?
                this.inlineActions[fullRoute] :
                new Jii.request.AnonymousAction(fullRoute, this, this.inlineActions[fullRoute]);

            return this.beforeAction(action, context).then(function (result) {
                if (result === false) {
                    return Promise.reject();
                }

                return action.runWithParams(context).then(function(data) {
                    if (!Jii._.isUndefined(data) && context.response instanceof Jii.base.Response) {
                        context.response.data = data;
                        context.response.send();
                    }

                    return this.beforeAction(action, context).then(function() {
                        return data;
                    });
                }.bind(this));
            }.bind(this)).catch(Jii.catchHandler);
        }

		var parts = this.createController(route);
		if (parts !== null) {
			/** @type {Jii.base.Controller} */
			var controller = parts[0];
			var actionId = parts[1];

			return controller.runAction(actionId, context);
		}

		var id = this.getUniqueId();
		var requestName = id ? id + '/' + route : route;
		//throw new Jii.exceptions.InvalidRouteException('Unable to resolve the request `' + requestName + '`.');
		Jii.info('Unable to resolve the request `' + requestName + '`.');
	},

	/**
	 *
	 * @param {string} route
	 * @return {boolean}
	 */
	existsRoute: function(route) {
        var routeParams = this._parseRoute(route);
        var id = routeParams.id;
        route = routeParams.route;

        if (Jii._.has(this.inlineActions, id + '/' + (route || 'index'))) {
            return true;
        }

		if (Jii._.has(this.controllerMap, id)) {
			return true;
		}

		var moduleObject = this.getModule(id);
		if (moduleObject !== null) {
			return moduleObject.existsRoute(route);
		}

		if (/^[a-z0-9\\-_]+$/.test(id)) {
			var className = id.charAt(0).toUpperCase() + id.slice(1);
			className = className.replace('-', '') + 'Controller';
			className = this.controllerNamespace + '.' + className;

			var controllerClass = Jii.namespace(className);
			if (Jii._.isFunction(controllerClass)) {
				var controller = new controllerClass(id, this);
				return controller.hasAction(route);
			}
		}

		return false;
	},

	/**
	 * Creates a controller instance based on the controller ID.
	 *
	 * The controller is created within this module. The method first attempts to
	 * create the controller based on the [[controllerMap]] of the module.
	 *
	 * @param {string} route the route consisting of module, controller and action IDs.
	 * @return {[]|null} If the controller is created successfully, it will be returned together
	 * with the requested action ID. Otherwise false will be returned.
	 * @throws {Jii.exceptions.InvalidConfigException} if the controller class and its file do not match.
	 */
	createController: function (route) {
        var routeParams = this._parseRoute(route);
        var id = routeParams.id;
        route = routeParams.route;

		var controller = null;
		if (Jii._.has(this.controllerMap, id)) {
			controller = Jii.createObject(this.controllerMap[id], id, this);
			return controller !== null ? [controller, route] : null;
		}

		var moduleObject = this.getModule(id);
		if (moduleObject !== null) {
			return moduleObject.createController(route);
		}

		if (/^[a-z0-9\\-_]+$/.test(id)) {

			var className = id.charAt(0).toUpperCase() + id.slice(1);
			className = className.replace('-', '') + 'Controller';
			className = this.controllerNamespace + '.' + className;

            // Cache controller instances
            if (!this._controllers[className]) {

                var controllerClass = Jii.namespace(className);
                if (Jii._.isFunction(controllerClass)) {
                    this._controllers[className] = new controllerClass(id, this);

                    if (!(this._controllers[className] instanceof Jii.base.Controller)) {
                        throw new Jii.exceptions.InvalidConfigException("Controller class must extend from Jii.base.Controller.");
                    }
                }
			}
            controller = this._controllers[className] || null;
		}

		return controller !== null ? [controller, route] : null;
	},

    _parseRoute: function(route) {
        if (route === '') {
            route = this.defaultRoute;
        }

        var index = route.indexOf('/');
        if (index !== -1) {
            return {
                id: route.substr(0, index),
                route: route.substr(index + 1)
            };
        }
        return {
            id: route,
            route: ''
        }
    },

	/**
	 * This method is invoked right before an action of this module is to be executed (after all possible filters.)
	 * You may override this method to do last-minute preparation for the action.
	 * Make sure you call the parent implementation so that the relevant event is triggered.
	 * @param {Jii.base.Action} action the action to be executed.
	 * @param {Jii.base.Context} context
	 * @return {Promise}
	 */
	beforeAction: function (action, context) {
        this.trigger(this.__static.EVENT_BEFORE_ACTION, new Jii.base.ActionEvent({
            action: action,
            context: context
        }));
        return Promise.resolve(true);
	},

	/**
	 * This method is invoked right after an action of this module has been executed.
	 * You may override this method to do some postprocessing for the action.
	 * Make sure you call the parent implementation so that the relevant event is triggered.
	 * @param {Jii.base.Action} action the action just executed.
     * @param {Jii.base.Context} context
     * @return {Promise}
	 */
	afterAction: function (action, context) {
        this.trigger(this.__static.EVENT_AFTER_ACTION, new Jii.base.ActionEvent({
            action: action,
            context: context
        }));
        return Promise.resolve();
	}

});
