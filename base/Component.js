/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const Behavior = require('./Behavior');
const Event = require('./Event');
const UnknownPropertyException = require('../exceptions/UnknownPropertyException');
const _upperFirst = require('lodash/upperFirst');
const _isUndefined = require('lodash/isUndefined');
const _isString = require('lodash/isString');
const _isFunction = require('lodash/isFunction');
const _isObject = require('lodash/isObject');
const _each = require('lodash/each');
const BaseObject = require('./BaseObject');

class Component extends BaseObject {

    preInit() {
        /**
         * @var {object} the attached behaviors (behavior name: behavior)
         */
        this._behaviors = null;

        /**
         * @var {object} the attached event handlers (event name: handlers)
         */
        this._events = null;

        /**
         * @var {Context|Module}
         */
        this.owner = null;

        super.preInit(...arguments);

        // Proxy behaviour methods
        this.proxyBehaviors();
    }

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
     * Note that a behavior class must extend from [[Behavior]]. Behavior names can be strings
     * or integers. If the former, they uniquely identify the behaviors. If the latter, the corresponding
     * behaviors are anonymous and their properties and methods will NOT be made available via the component
     * (however, the behaviors can still respond to the component's events).
     *
     * Behaviors declared in this method will be attached to the component automatically (on demand).
     *
     * @return {object} the behavior configurations.
     */
    behaviors() {
        return {};
    }

    /**
     * Returns a value indicating whether there is any handler attached to the named event.
     * @param {string} name the event name
     * @return {boolean} whether there is any handler attached to the event.
     */
    hasEventHandlers(name) {
        this.ensureBehaviors();

        return this._events && this._events[name] && this._events[name].length > 0 ? true : false; // @todo || Event::hasHandlers(this, name);
    }

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
     * where `event` is an [[Event]] object which includes parameters associated with the event.
     *
     * @param {string|string[]} name the event name
     * @param {function} handler the event handler
     * @param {*} [data] the data to be passed to the event handler when the event is triggered.
     * When the event handler is invoked, this data can be accessed via data.
     * @param {boolean} [isAppend] whether to append new event handler to the end of the existing
     * handler list. If false, the new handler will be inserted at the beginning of the existing
     * handler list.
     * @see off()
     */
    on(name, handler, data, isAppend) {
        data = data || null;
        isAppend = _isUndefined(isAppend) ? true : isAppend;

        // Multiple names support
        name = this._normalizeEventNames(name);
        if (name.length > 1) {
            _each(name, n => {
                this.on(n, handler, data, isAppend);
            });
            return;
        } else {
            name = name[0];
        }

        handler = Event.normalizeHandler(handler);

        this.ensureBehaviors();
        if (isAppend || !this._events || !this._events[name]) {
            this._events = this._events || {};
            this._events[name] = this._events[name] || [];
            this._events[name].push([
                handler,
                data
            ]);
        } else {
            this._events[name].unshift([
                handler,
                data
            ]);
        }
    }

    /**
     * Detaches an existing event handler from this component.
     * This method is the opposite of [[on()]].
     * @param {string|string[]} name event name
     * @param {function} [handler] the event handler to be removed.
     * If it is null, all handlers attached to the named event will be removed.
     * @return boolean if a handler is found and detached
     * @see on()
     */
    off(name, handler) {
        handler = handler || null;

        // Multiple names support
        name = this._normalizeEventNames(name);
        if (name.length > 1) {
            var bool = false;
            _each(name, n => {
                if (this.on(n, handler)) {
                    bool = true;
                }
            });
            return bool;
        } else {
            name = name[0];
        }

        this.ensureBehaviors();
        if (!this._events || !this._events[name]) {
            return false;
        }

        if (handler === null) {
            delete this._events[name];
            return true;
        }

        handler = Event.normalizeHandler(handler);

        var newEvents = [];
        var isRemoved = false;
        _each(this._events[name], event => {
            if (handler.callback === event[0].callback && (handler.context === null || handler.context === event[0].context)) {
                isRemoved = true;
            } else {
                newEvents.push(event);
            }
        });
        this._events[name] = newEvents;

        return isRemoved;
    }

    _normalizeEventNames(names) {
        return _isString(names) ? names.split(/[ ,]+/) : names;
    }

    /**
     * Triggers an event.
     * This method represents the happening of an event. It invokes
     * all attached handlers for the event including class-level handlers.
     * @param {string} name the event name
     * @param {Event} [event] the event parameter. If not set, a default [[Event]] object will be created.
     */
    trigger(name, event) {
        this.ensureBehaviors();
        if (this._events && this._events[name]) {
            if (event === null) {
                event = new Event();
            }
            if (!(event instanceof Event)) {
                event = new Event({
                    params: event
                });
            }

            if (event.sender === null) {
                event.sender = this;
            }

            event.handled = false;
            event.name = name;

            var isStopped = false;
            _each(this._events[name], handler => {
                if (isStopped) {
                    return;
                }

                event.data = handler[1];
                handler[0].callback.call(handler[0].context, event);

                // stop further handling if the event is handled
                if (event.handled) {
                    isStopped = true;
                }
            });
        }

        // invoke class-level attached handlers
        Event.trigger(this, name, event);
    }

    /**
     * Returns the named behavior object.
     * @param {string} name the behavior name
     * @return {Behavior} the behavior object, or null if the behavior does not exist
     */
    getBehavior(name) {
        this.ensureBehaviors();

        return this._behaviors && this._behaviors[name] ? this._behaviors[name] : null;
    }

    /**
     * Returns all behaviors attached to this component.
     * @return {object} list of behaviors attached to this component
     */
    getBehaviors() {
        this.ensureBehaviors();

        return this._behaviors;
    }

    /**
     * Attaches a behavior to this component.
     * This method will create the behavior object based on the given
     * configuration. After that, the behavior object will be attached to
     * this component by calling the attach method.
     * @param {string} name the name of the behavior.
     * @param {string|Behavior[]|Behavior} behavior the behavior configuration. This can be one of the following:
     *
     *  - a [[Behavior]] object
     *  - a string specifying the behavior class
     *  - an object configuration array that will be passed to [[Jii.createObject()]] to create the behavior object.
     *
     * @return {Behavior} the behavior object
     * @see detachBehavior()
     */
    attachBehavior(name, behavior) {
        this.ensureBehaviors();

        return this._attachBehaviorInternal(name, behavior);
    }

    /**
     * Attaches a list of behaviors to the component.
     * Each behavior is indexed by its name and should be a [[Behavior]] object,
     * a string specifying the behavior class, or an configuration array for creating the behavior.
     * @param {[]} behaviors list of behaviors to be attached to the component
     * @see attachBehavior()
     */
    attachBehaviors(behaviors) {
        this.ensureBehaviors();

        _each(behaviors, (behavior, name) => {
            this._attachBehaviorInternal(name, behavior);
        });
    }

    /**
     * Detaches a behavior from the component.
     * The behavior's detach method will be invoked.
     * @param {string} name the behavior's name.
     * @return {Behavior} the detached behavior. Null if the behavior does not exist.
     */
    detachBehavior(name) {
        this.ensureBehaviors();
        if (this._behaviors && this._behaviors[name]) {
            var behavior = this._behaviors[name];
            delete this._behaviors[name];
            behavior.detach();

            return behavior;
        }

        return null;
    }

    /**
     * Detaches all behaviors from the component.
     */
    detachBehaviors() {
        this.ensureBehaviors();

        _each(_keys(this._behaviors), this.detachBehavior.bind(this));
    }

    /**
     * Makes sure that the behaviors declared in [[behaviors()]] are attached to this component.
     */
    ensureBehaviors() {
        if (this._behaviors !== null) {
            return;
        }

        this._behaviors = [];
        _each(this.behaviors(), (behavior, name) => {
            this._attachBehaviorInternal(name, behavior);
        });
    }

    /**
     *
     */
    proxyBehaviors() {
        _each(this.behaviors(), (behavior, name) => {
            this._proxyBehaviorInternal(name, behavior);
        });
    }

    /**
     * Attaches a behavior to this component.
     * @param {string} name the name of the behavior.
     * @param {string|Behavior} behavior the behavior to be attached
     * @return {Behavior} the attached behavior.
     * @private
     */
    _attachBehaviorInternal(name, behavior) {
        if (!(behavior instanceof Behavior)) {
            behavior = Jii.createObject(behavior);
        }

        if (this._behaviors[name]) {
            this._behaviors[name].detach();
        }
        behavior.attach(this);

        this._proxyBehaviorInternal(name, behavior.constructor);

        this._behaviors[name] = behavior;
        return behavior;
    }

    /**
     *
     */
    _proxyBehaviorInternal(behaviorName, className) {
        var behaviorClass = Jii.namespace(className);

        while (true) {
            if (!behaviorClass || !behaviorClass.prototype || behaviorClass === Behavior) {
                break;
            }

            for (let name of Object.getOwnPropertyNames(behaviorClass.prototype)) {
                // Skip constructor and non-public methods
                if (name === 'constructor' || name === 'preInit' || name.substr(0, 1) === '_') {
                    continue;
                }

                // Skip properties
                if (!_isFunction(behaviorClass.prototype[name])) {
                    continue;
                }

                this[name] = this._getProxyBehaviorMethod(behaviorName, name);
            }

            behaviorClass = Object.getPrototypeOf(behaviorClass);
        }
    }

    _getProxyBehaviorMethod(behaviorName, methodName) {
        var context = this;

        return () => {
            return context.getBehavior(behaviorName)[methodName].apply(context, arguments);
        };
    }

    hasProperty(name, checkVars, checkBehaviors) {
        checkVars = checkVars !== false;
        checkBehaviors = checkBehaviors !== false;

        return this.canGetProperty(name, checkVars, checkBehaviors) || this.canSetProperty(name, false, checkBehaviors);
    }

    // @todo move get, set to Object
    set(name, value) {
        // Object format support
        if (_isObject(name)) {
            _each(name, (value, name) => {
                this.set(name, value);
            });
            return;
        }

        // Generate setter name
        var setter = 'set' + _upperFirst(name);

        if (_isFunction(this[setter])) {
            this[setter].call(this, value);
        } else if (this.hasOwnProperty(name)) {
            this[name] = value;
        } else if (name.substr(0, 3) === 'on ') {
            this.on(name.substr(3), value);
        } else if (name.substr(0, 3) === 'as ') {
            this.attachBehavior(name.substr(3), value instanceof Behavior ? value : Jii.createObject(value));
        } else {
            // @todo as, see Component Yii2

            throw new UnknownPropertyException('Setting unknown property: ' + this.className() + '.' + name);
        }
    }

    canSetProperty(name, checkVars, checkBehaviors) {
        checkVars = checkVars !== false;
        checkBehaviors = checkBehaviors !== false;

        var setter = 'set' + _upperFirst(name);
        if (_isFunction(this[setter]) || checkVars && this.hasOwnProperty(name)) {
            return true;
        } else if (checkBehaviors) {
        }

        return false;
    }

    get(name) {
        // Generate getter name
        var setter = 'get' + _upperFirst(name);

        if (_isFunction(this[setter])) {
            return this[setter].call(this);
        } else if (this.hasOwnProperty(name)) {
            return this[name];
        } else {
            throw new UnknownPropertyException('Getting unknown property: ' + this.className() + '.' + name);
        }
    }

    canGetProperty(name, checkVars, checkBehaviors) {
        checkVars = checkVars !== false;
        checkBehaviors = checkBehaviors !== false;

        var getter = 'get' + _upperFirst(name);
        if (_isFunction(this[getter]) || checkVars && this.hasOwnProperty(name)) {
            return true;
        } else if (checkBehaviors) {
        }

        return false;
    }

}
module.exports = Component;