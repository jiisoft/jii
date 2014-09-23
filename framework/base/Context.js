/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

/**
 * @class Jii.app.Context
 * @extends Jii.base.Component
 */
Jii.defineClass('Jii.base.Context', {

	__extends: Jii.base.Component,

	/**
	 * Custom context parameters (name => value).
	 * @type {object}
	 */
	params: null,

	/**
	 * @type {object}
	 */
	_components: null,

	/**
	 * @constructor
	 */
	constructor: function (config) {
		this.params = {};
		this._components = {};
		this.__super(config);
	},

	/**
	 * Checks whether the named component exists.
	 * @param {string} id component ID
	 * @return {boolean} whether the named component exists. Both loaded and unloaded components
	 * are considered.
	 */
	hasComponent: function (id) {
		return _.has(this._components, id);
	},

	/**
	 * Retrieves the named component.
	 * @param {string} id component ID (case-sensitive)
	 * @return {Jii.base.Component|null} the component instance, null if the component does not exist.
	 */
	getComponent: function (id) {
		return this._components[id] || null;
	},

	/**
	 * Registers a component with this module.
	 * @param {string} id component ID
	 * @param {Jii.base.Component|array|null} component the component to be registered with the module. This can
	 * be one of the followings:
	 *
	 * - a [[Jii.base.Component]] object
	 * - a configuration array: when [[getComponent()]] is called initially for this component, the array
	 *   will be used to instantiate the component via [[Jii.createObject()]].
	 * - null: the named component will be removed from the module
	 */
	setComponent: function (id, component) {
		if (component === null) {
			delete this._components[id];
		} else {
			// Create component instance
			if (!(component instanceof Jii.base.Component)) {
				component = Jii.createObject(component, id, this);
			}

			// Add links
			this[id] = this._components[id] = component;
		}
	},

	/**
	 * Returns the registered components.
	 * @return {Jii.base.Component[]} the components (indexed by their IDs)
	 */
	getComponents: function () {
		return this._components;
	},

	/**
	 * Registers a set of components in this module.
	 *
	 * Each component should be specified as a name-value pair, where
	 * name refers to the ID of the component and value the component or a configuration
	 * array that can be used to create the component. In the latter case, [[Jii.createObject()]]
	 * will be used to create the component.
	 *
	 * If a new component has the same ID as an existing one, the existing one will be overwritten silently.
	 *
	 * The following is an example for setting two components:
	 *
	 * ~~~
	 * {
     *     db: {
     *         class: 'Jii.db.Connection',
     *         dsn: 'sqlite:path/to/file.db'
     *     },
     *     cache: {
     *         class: 'Jii.caching.DbCache',
     *         db: 'db'
     *     }
     * }
	 * ~~~
	 *
	 * @param {array} components components (id => component configuration or instance)
	 */
	setComponents: function (components) {
		_.each(components, _.bind(function (component, id) {
			// Extend default class name
			if (!(component instanceof Jii.base.Component) && this._components[id] && !component.className) {
				component.className = this._components[id].className;
			}

			this.setComponent(id, component);
		}, this));
	},

	/**
	 * Loads components that are declared in [[preload]].
	 * @throws {Jii.exceptions.InvalidConfigException} if a component or module to be preloaded is unknown
	 */
	preloadComponents: function () {
		_.each(this.preload, _.bind(function (id) {
			if (this.hasComponent(id)) {
				this.getComponent(id);
			} else if (this.hasModule(id)) {
				this.getModule(id);
			} else {
				throw new Jii.exceptions.InvalidConfigException("Unknown component or module: " + id);
			}
		}, this));
	}

});
