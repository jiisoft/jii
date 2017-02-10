/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Event = require('./Event');
const _each = require('lodash/each');
const BaseObject = require('./BaseObject');

class Behavior extends BaseObject {

    preInit() {
        /**
         * @var {Component} the owner of this behavior
         */
        this.owner = null;

        super.preInit(...arguments);
    }

    /**
     * Declares event handlers for the [[owner]]'s events.
     *
     * Child classes may override this method to declare what callbacks should
     * be attached to the events of the [[owner]] component.
     *
     * The callbacks will be attached to the [[owner]]'s events when the behavior is
     * attached to the owner; and they will be detached from the events when
     * the behavior is detached from the component.
     *
     * The callbacks can be any of the followings:
     *
     * - method in this behavior: `'handleClick'`
     * - anonymous function: `function (event) { ... }`
     * - method with context: `{callback: function (event) { ... }, context: this}`
     *
     * The following is an example:
     *
     * ~~~
     * {
     *     beforeValidate: 'myBeforeValidate',
     *     afterValidate: {
     *         callback: function() {},
     *         context: this
     *     }
     * }
     * ~~~
     *
     * @return {object} events (array keys) and the corresponding event handler methods (array values).
     */
    events() {
        return {};
    }

    /**
     * Attaches the behavior object to the component.
     * The default implementation will set the [[owner]] property
     * and attach event handlers as declared in [[events]].
     * Make sure you call the parent implementation if you override this method.
     * @param {Component} owner the component that this behavior is to be attached to.
     */
    attach(owner) {
        this.owner = owner;

        _each(this.events(), (handler, event) => {
            handler = Event.normalizeHandler(handler, this);
            this.owner.on(event, handler);
        });
    }

    /**
     * Detaches the behavior object from the component.
     * The default implementation will unset the [[owner]] property
     * and detach event handlers declared in [[events]].
     * Make sure you call the parent implementation if you override this method.
     */
    detach() {
        if (!this.owner) {
            return;
        }

        _each(this.events(), (handler, event) => {
            handler = Event.normalizeHandler(handler, this);
            this.owner.off(event, handler);
        });
        this.owner = null;
    }

}
module.exports = Behavior;