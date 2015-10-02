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

require('./Object');

/**
 * @class Jii.base.Component
 * @extends Jii.base.Object
 */
Jii.defineClass('Jii.base.Component', /** @lends Jii.base.Component.prototype */{

	__extends: Jii.base.Object,

	/**
	 * @var {object} the attached event handlers (event name: handlers)
	 */
	_events: null,

	/**
	 * @var {object} the attached behaviors (behavior name: behavior)
	 */
	_behaviors: null,

	/**
	 * @constructor
	 */
	constructor: function () {
		// Proxy behaviour methods
		this.proxyBehaviors();

		this.__super.apply(this, arguments);
	},

	/**
	 * Returns a list of behaviors that this component should behave as.
	 *
	 * Child classes may override this method to specify the behaviors they want to behave as.
	 *
	 * The return value of this method should be an array of behavior objects or configurations
	 * indexed by behavior names. A behavior configuration can be either a string specifying
	 * the behavior class or an array of the following structure:
	 *
	 * ~~~
	 * behaviorName: {
	 *     class: 'BehaviorClass',
	 *     property1: 'value1',
	 *     property2: 'value2'
	 * }
	 * ~~~
	 *
	 * Note that a behavior class must extend from [[Jii.base.Behavior]]. Behavior names can be strings
	 * or integers. If the former, they uniquely identify the behaviors. If the latter, the corresponding
	 * behaviors are anonymous and their properties and methods will NOT be made available via the component
	 * (however, the behaviors can still respond to the component's events).
	 *
	 * Behaviors declared in this method will be attached to the component automatically (on demand).
	 *
	 * @return {object} the behavior configurations.
	 */
	behaviors: function () {
		return {};
	},

	/**
	 * Returns a value indicating whether there is any handler attached to the named event.
	 * @param {string} name the event name
	 * @return {boolean} whether there is any handler attached to the event.
	 */
	hasEventHandlers: function (name) {
		this.ensureBehaviors();

		return this._events && this._events[name] && this._events[name].length > 0 ? true : false;// @todo || Event::hasHandlers(this, name);
	},

	/**
	 * Attaches an event handler to an event.
	 *
	 * The event handler must be a valid PHP callback. The followings are
	 * some examples:
	 *
	 * ~~~
	 * function (event) { ... }         // anonymous function
	 * ~~~
	 *
	 * The event handler must be defined with the following signature,
	 *
	 * ~~~
	 * function (event)
	 * ~~~
	 *
	 * where `event` is an [[Jii.base.Event]] object which includes parameters associated with the event.
	 *
	 * @param {string} name the event name
	 * @param {function} handler the event handler
	 * @param {*} [data] the data to be passed to the event handler when the event is triggered.
	 * When the event handler is invoked, this data can be accessed via data.
	 * @param {boolean} [isAppend] whether to append new event handler to the end of the existing
	 * handler list. If false, the new handler will be inserted at the beginning of the existing
	 * handler list.
	 * @see off()
	 */
	on: function (name, handler, data, isAppend) {
		data = data || null;
		isAppend = Jii._.isUndefined(isAppend) ? true : isAppend;

		this.ensureBehaviors();
		if (isAppend || !this._events || !this._events[name]) {
			this._events = this._events || {};
			this._events[name] = this._events[name] || [];
			this._events[name].push([handler, data]);
		} else {
			this._events[name].unshift([handler, data]);
		}
	},

	/**
	 * Detaches an existing event handler from this component.
	 * This method is the opposite of [[on()]].
	 * @param {string} name event name
	 * @param {function} [handler] the event handler to be removed.
	 * If it is null, all handlers attached to the named event will be removed.
	 * @return boolean if a handler is found and detached
	 * @see on()
	 */
	off: function (name, handler) {
		handler = handler || null;

		this.ensureBehaviors();
		if (!this._events || !this._events[name]) {
			return false;
		}

		if (handler === null) {
			delete this._events[name];
			return true;
		}

		var newEvents = [];
		var isRemoved = false;
		Jii._.each(this._events[name], Jii._.bind(function(event, i) {
			if (event[0] !== handler) {
				newEvents.push(event);
			} else {
				isRemoved = true;
			}
		}, this));
		this._events[name] = newEvents;

		return isRemoved;
	},

	/**
	 * Triggers an event.
	 * This method represents the happening of an event. It invokes
	 * all attached handlers for the event including class-level handlers.
	 * @param {string} name the event name
	 * @param {Jii.base.Event} [event] the event parameter. If not set, a default [[Jii.base.Event]] object will be created.
	 */
	trigger: function (name, event) {
		this.ensureBehaviors();
		if (this._events && this._events[name]) {
			if (event === null) {
				event = new Jii.base.Event();
			}
			if (!(event instanceof Jii.base.Event)) {
				event = new Jii.base.Event({
					params: event
				});
			}

			if (event.sender === null) {
				event.sender = this;
			}

			event.handled = false;
			event.name = name;

			var isStopped = false;
			Jii._.each(this._events[name], function(handler) {
				if (isStopped) {
					return;
				}

				event.data = handler[1];
				handler[0] = Jii.base.Event.normalizeHandler(handler[0]);
				handler[0].callback.call(handler[0].context, event);

				// stop further handling if the event is handled
				if (event.handled) {
					isStopped = true;
				}
			});
		}

		// invoke class-level attached handlers
		Jii.base.Event.trigger(this, name, event);
	},

	/**
	 * Returns the named behavior object.
	 * @param {string} name the behavior name
	 * @return {Jii.base.Behavior} the behavior object, or null if the behavior does not exist
	 */
	getBehavior: function (name) {
		this.ensureBehaviors();

		return this._behaviors && this._behaviors[name] ? this._behaviors[name] : null;
	},

	/**
	 * Returns all behaviors attached to this component.
	 * @return {object} list of behaviors attached to this component
	 */
	getBehaviors: function () {
		this.ensureBehaviors();

		return this._behaviors;
	},

	/**
	 * Attaches a behavior to this component.
	 * This method will create the behavior object based on the given
	 * configuration. After that, the behavior object will be attached to
	 * this component by calling the attach method.
	 * @param {string} name the name of the behavior.
	 * @param {string|Jii.base.Behavior[]|Jii.base.Behavior} behavior the behavior configuration. This can be one of the following:
	 *
	 *  - a [[Jii.base.Behavior]] object
	 *  - a string specifying the behavior class
	 *  - an object configuration array that will be passed to [[Jii.createObject()]] to create the behavior object.
	 *
	 * @return {Jii.base.Behavior} the behavior object
	 * @see detachBehavior()
	 */
	attachBehavior: function (name, behavior) {
		this.ensureBehaviors();

		return this._attachBehaviorInternal(name, behavior);
	},

	/**
	 * Attaches a list of behaviors to the component.
	 * Each behavior is indexed by its name and should be a [[Jii.base.Behavior]] object,
	 * a string specifying the behavior class, or an configuration array for creating the behavior.
	 * @param {[]} behaviors list of behaviors to be attached to the component
	 * @see attachBehavior()
	 */
	attachBehaviors: function (behaviors) {
		this.ensureBehaviors();

		Jii._.each(behaviors, Jii._.bind(function(behavior, name) {
			this._attachBehaviorInternal(name, behavior);
		}, this));
	},

	/**
	 * Detaches a behavior from the component.
	 * The behavior's detach method will be invoked.
	 * @param {string} name the behavior's name.
	 * @return {Jii.base.Behavior} the detached behavior. Null if the behavior does not exist.
	 */
	detachBehavior: function (name) {
		this.ensureBehaviors();
		if (this._behaviors && this._behaviors[name]) {
			var behavior = this._behaviors[name];
			delete this._behaviors[name];
			behavior.detach();

			return behavior;
		}

		return null;
	},

	/**
	 * Detaches all behaviors from the component.
	 */
	detachBehaviors: function () {
		this.ensureBehaviors();

		Jii._.each(Jii._.keys(this._behaviors), Jii._.bind(this.detachBehavior, this));
	},

	/**
	 * Makes sure that the behaviors declared in [[behaviors()]] are attached to this component.
	 */
	ensureBehaviors: function () {
		if (this._behaviors !== null) {
			return;
		}

		this._behaviors = [];
		Jii._.each(this.behaviors(), Jii._.bind(function(behavior, name) {
			this._attachBehaviorInternal(name, behavior);
		}, this));
	},

	/**
	 *
	 */
	proxyBehaviors: function () {
		Jii._.each(this.behaviors(), Jii._.bind(function(behavior, name) {
			var className = Jii._.isString(behavior) ? behavior : behavior.className;
			this._proxyBehaviorInternal(name, className);
		}, this));
	},

	/**
	 * Attaches a behavior to this component.
	 * @param {string} name the name of the behavior.
	 * @param {string|Jii.base.Behavior[]|Jii.base.Behavior} behavior the behavior to be attached
	 * @return {Jii.base.Behavior} the attached behavior.
	 * @private
	 */
	_attachBehaviorInternal: function (name, behavior) {
		if (!(behavior instanceof Jii.base.Behavior)) {
			behavior = Jii.createObject(behavior);
		}

		if (this._behaviors[name]) {
			this._behaviors[name].detach();
		}
		behavior.attach(this);

		this._proxyBehaviorInternal(name, behavior.className());

		this._behaviors[name] = behavior;
		return behavior;
	},

	/**
	 *
	 */
	_proxyBehaviorInternal: function (behaviorName, className) {
		var behaviorClass = Jii.namespace(className);

		while (true) {
			if (!behaviorClass || !behaviorClass.prototype || className === 'Jii.base.Behavior') {
				break;
			}

			for (var name in behaviorClass.prototype) {
				if (!behaviorClass.prototype.hasOwnProperty(name)) {
					continue;
				}

				// Skip constructor and non-public methods
				if (name === 'constructor' || name.substr(0, 1) === '_') {
					continue;
				}

				// Skip properties
				if (!Jii._.isFunction(behaviorClass.prototype[name])) {
					continue;
				}

				this[name] = this._getProxyBehaviorMethod(behaviorName, name);
			}

			className = behaviorClass.parentClassName();
			behaviorClass = Jii.namespace(className);
		}
	},

	_getProxyBehaviorMethod: function(behaviorName, methodName) {
		var context = this;

		return function() {
			return context.getBehavior(behaviorName)[methodName].apply(context, arguments);
		};
	},

	hasProperty: function(name, checkVars, checkBehaviors) {
		checkVars = checkVars !== false;
		checkBehaviors = checkBehaviors !== false;

		return this.canGetProperty(name, checkVars, checkBehaviors) || this.canSetProperty(name, false, checkBehaviors);
	},

	// @todo move get, set to Object
	set: function(name, value) {
		// Generate setter name
		var setter = 'set' + Jii._s.capitalize(name);

		if (Jii._.isFunction(this[setter])) {
			this[setter].call(this, value);
		} else if (this.hasOwnProperty(name)) {
			this[name] = value;
		} else if (name.substr(0, 3) === 'on ') {
            this.on(name.substr(3), value);
		} else if (name.substr(0, 3) === 'as ') {
            this.attachBehavior(name.substr(3), value instanceof Jii.base.Behavior ? value : Jii.createObject(value));
		} else {
			// @todo as, see Component Yii2

			throw new Jii.exceptions.UnknownPropertyException('Setting unknown property: ' + this.className() + '.' + name);
		}
	},

	canSetProperty: function(name, checkVars, checkBehaviors) {
		checkVars = checkVars !== false;
		checkBehaviors = checkBehaviors !== false;

		var setter = 'set' + Jii._s.capitalize(name);
		if (Jii._.isFunction(this[setter]) || (checkVars && this.hasOwnProperty(name))) {
			return true;
		} else if (checkBehaviors) {

		}

		return false;
	},

	get: function(name) {
		// Generate getter name
		var setter = 'get' + Jii._s.capitalize(name);

		if (Jii._.isFunction(this[setter])) {
			return this[setter].call(this);
		} else if (this.hasOwnProperty(name)) {
			return this[name];
		} else {
			throw new Jii.exceptions.UnknownPropertyException('Getting unknown property: ' + this.className() + '.' + name);
		}
	},

	canGetProperty: function(name, checkVars, checkBehaviors) {
		checkVars = checkVars !== false;
		checkBehaviors = checkBehaviors !== false;

		var getter = 'get' + Jii._s.capitalize(key);
		if (Jii._.isFunction(this[getter]) || (checkVars && this.hasOwnProperty(name))) {
			return true;
		} else if (checkBehaviors) {

		}

		return false;
	}

});
