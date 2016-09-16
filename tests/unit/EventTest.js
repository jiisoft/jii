'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('../../index');
var Event = require('../../base/Event');
require('./bootstrap');

var tests = Jii.namespace('tests');

/**
 * @class tests.unit.EventTest
 * @extends Jii.base.UnitTest
 */
var self = Jii.defineClass('tests.unit.EventTest', {

	__extends: 'Jii.base.UnitTest',

	_counter: null,

	setUp: function () {

		// Clear
		this._counter = 0;
		Event.off(tests.unit.Post.className(), 'save');
		Event.off(tests.unit.User.className(), 'save');
		Event.off(tests.unit.ActiveRecord.className(), 'save');

		return this.__super();
	},

	onTest: function (test) {
		Event.on(tests.unit.Post.className(), 'save', function(event) {
			this._counter += 1;
		}.bind(this));
		Event.on(tests.unit.ActiveRecord.className(), 'save', function(event) {
			this._counter += 3;
		}.bind(this));

		test.strictEqual(this._counter, 0);

		var post = new tests.unit.Post();
		post.save();
		test.strictEqual(this._counter, 4);

		var user = new tests.unit.User();
		user.save();
		test.strictEqual(this._counter, 7);

		test.done();
	},

	offTest: function(test) {
		var handler = function() {};

		test.strictEqual(Event.hasHandlers(tests.unit.Post.className(), 'save'), false);
		Event.on(tests.unit.Post.className(), 'save', handler);
		test.strictEqual(Event.hasHandlers(tests.unit.Post.className(), 'save'), true);
		Event.off(tests.unit.Post.className(), 'save', handler);
		test.strictEqual(Event.hasHandlers(tests.unit.Post.className(), 'save'), false);

		test.done();
	},

	hasTest: function(test) {
		test.strictEqual(Event.hasHandlers(tests.unit.Post.className(), 'save'), false);
		test.strictEqual(Event.hasHandlers(tests.unit.ActiveRecord.className(), 'save'), false);

		Event.on(tests.unit.Post.className(), 'save', function() {});
		test.strictEqual(Event.hasHandlers(tests.unit.Post.className(), 'save'), true);
		test.strictEqual(Event.hasHandlers(tests.unit.ActiveRecord.className(), 'save'), false);

		test.strictEqual(Event.hasHandlers(tests.unit.User.className(), 'save'), false);
		Event.on(tests.unit.ActiveRecord.className(), 'save', function() {});
		test.strictEqual(Event.hasHandlers(tests.unit.User.className(), 'save'), true);
		test.strictEqual(Event.hasHandlers(tests.unit.ActiveRecord.className(), 'save'), true);

		test.done();
	},

	instanceTest: function(test) {
		var eventTriggerCount = 0;
		var counter = () => {
			return eventTriggerCount;
		};
		var callback = () => {
			eventTriggerCount++;
		}

		// Format: callback
		eventTriggerCount = 0;
		this._onOff(test, callback, counter, callback);

		// Format object
		eventTriggerCount = 0;
		this._onOff(test, {callback: callback, context: this}, counter, callback);

		test.done();
	},

	_onOff: function(test, onHandler, counter, offHandler) {
		var model = new tests.unit.User();
		test.strictEqual(model.hasEventHandlers('save'), false);
		test.strictEqual(counter(), 0);

		model.on('save', onHandler);
		test.strictEqual(model.hasEventHandlers('save'), true);
		test.strictEqual(counter(), 0);

		model.trigger('save');
		test.strictEqual(counter(), 1);

		model.off('save', offHandler);
		test.strictEqual(model.hasEventHandlers('save'), false);

		model.trigger('save');
		test.strictEqual(counter(), 1);
	}

});

/**
 * @class tests.unit.ActiveRecord
 * @extends Jii.base.Component
 */
Jii.defineClass('tests.unit.ActiveRecord', {
	__extends: 'Jii.base.Component',
	save: function() {
		this.trigger('save');
	}
});

/**
 * @class tests.unit.User
 * @extends tests.unit.ActiveRecord
 */
Jii.defineClass('tests.unit.User', {
	__extends: 'tests.unit.ActiveRecord'
});

/**
 * @class tests.unit.Post
 * @extends tests.unit.ActiveRecord
 */
Jii.defineClass('tests.unit.Post', {
	__extends: 'tests.unit.ActiveRecord'
});

module.exports = new self().exports();
