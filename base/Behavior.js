/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../Jii');
var Event = require('./Event');
var _each = require('lodash/each');
var Object = require('./Object');

/**
 * @class Jii.base.Behavior
 * @extends Jii.base.Object
 */
module.exports = Jii.defineClass('Jii.base.Behavior', /** @lends Jii.base.Behavior.prototype */{

	__extends: Object,

	/**
	 * @var {Jii.base.Component} the owner of this behavior
	 */
	owner: null,

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
	},

	/**
	 * Attaches the behavior object to the component.
	 * The default implementation will set the [[owner]] property
	 * and attach event handlers as declared in [[events]].
	 * Make sure you call the parent implementation if you override this method.
	 * @param {Jii.base.Component} owner the component that this behavior is to be attached to.
	 */
	attach(owner) {
		this.owner = owner;

		_each(this.events(), (handler, event) => {
			handler = Event.normalizeHandler(handler, this);
			this.owner.on(event, handler);
		});
	},

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

});
