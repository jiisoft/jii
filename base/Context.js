/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../Jii');
var _isObject = require('lodash/isObject');
var _has = require('lodash/has');
var _each = require('lodash/each');
var Component = require('./Component');

/**
 * @class Jii.base.Context
 * @extends Jii.base.Component
 */
module.exports = Jii.defineClass('Jii.base.Context', /** @lends Jii.base.Context.prototype */{

	__extends: Component,

	/**
	 * Custom context parameters (name => value).
	 * @type {object}
	 */
	params: {},

    /**
     * @type {Jii.base.Request|Jii.base.HttpRequest}
     */
    request: null,

    /**
     * @type {Jii.base.Response}
     */
    response: null,

	/**
	 * @type {object}
	 */
	_components: {},

    _coreComponents: require('../components.json'),

	/**
	 * Checks whether the named component exists.
	 * @param {string} id component ID
	 * @return {boolean} whether the named component exists. Both loaded and unloaded components
	 * are considered.
	 */
	hasComponent(id) {
		return _has(this._components, id);
	},

	/**
	 * Retrieves the named component.
	 * @param {string} id component ID (case-sensitive)
	 * @return {Jii.base.Component|null} the component instance, null if the component does not exist.
	 */
	getComponent(id) {
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
	setComponent(id, component) {
		if (component === null) {
			delete this._components[id];
		} else {
			// Create component instance
			if (!(component instanceof Jii.base.Component)) {
                // Auto get class name
                if (!component.className && _has(this._coreComponents, id)) {
                    component.className = _isObject(this._coreComponents[id]) ?
                        (Jii.isNode ? this._coreComponents[id].server : this._coreComponents[id].client) :
                        this._coreComponents[id];
                }

                if (component.className) {
                    var componentClass = Jii.namespace(component.className);
                    if (typeof componentClass.prototype.owner !== 'undefined') {
                        component.owner = this;
                    }
                }

				component = Jii.createObject(component);
			}

			// Add links
			this[id] = this._components[id] = component;
		}
	},

	/**
	 * Returns the registered components.
	 * @return {Jii.base.Component[]} the components (indexed by their IDs)
	 */
	getComponents() {
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
	setComponents(components) {
		_each(components, (component, id) => {
			// Extend default class name
			if (!(component instanceof Jii.base.Component) && this._components[id] && !component.className) {
				component.className = this._components[id].className;
			}

			this.setComponent(id, component);
		});
	},

	/**
	 * Loads components that are declared in [[preload]].
	 * @throws {Jii.exceptions.InvalidConfigException} if a component or module to be preloaded is unknown
	 */
	preloadComponents() {
		_each(this.preload, id => {
			if (this.hasComponent(id)) {
				this.getComponent(id);
			} else if (this.hasModule(id)) {
				this.getModule(id);
			} else {
				throw new Jii.exceptions.InvalidConfigException("Unknown component or module: " + id);
			}
		});
	}

});
