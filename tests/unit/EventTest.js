'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('../../index');
require('./bootstrap');

var tests = Jii.namespace('tests');

/**
 * @class tests.unit.EventTest
 * @extends Jii.base.UnitTest
 */
var self = Jii.defineClass('tests.unit.EventTest', {

	__extends: Jii.base.UnitTest,

	_counter: null,

	setUp: function () {

		// Clear
		this._counter = 0;
		Jii.base.Event.off(tests.unit.Post.className(), 'save');
		Jii.base.Event.off(tests.unit.User.className(), 'save');
		Jii.base.Event.off(tests.unit.ActiveRecord.className(), 'save');

		return this.__super();
	},

	onTest: function (test) {
		Jii.base.Event.on(tests.unit.Post.className(), 'save', function(event) {
			this._counter += 1;
		}.bind(this));
		Jii.base.Event.on(tests.unit.ActiveRecord.className(), 'save', function(event) {
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

		test.strictEqual(Jii.base.Event.hasHandlers(tests.unit.Post.className(), 'save'), false);
		Jii.base.Event.on(tests.unit.Post.className(), 'save', handler);
		test.strictEqual(Jii.base.Event.hasHandlers(tests.unit.Post.className(), 'save'), true);
		Jii.base.Event.off(tests.unit.Post.className(), 'save', handler);
		test.strictEqual(Jii.base.Event.hasHandlers(tests.unit.Post.className(), 'save'), false);

		test.done();
	},

	hasTest: function(test) {
		test.strictEqual(Jii.base.Event.hasHandlers(tests.unit.Post.className(), 'save'), false);
		test.strictEqual(Jii.base.Event.hasHandlers(tests.unit.ActiveRecord.className(), 'save'), false);

		Jii.base.Event.on(tests.unit.Post.className(), 'save', function() {});
		test.strictEqual(Jii.base.Event.hasHandlers(tests.unit.Post.className(), 'save'), true);
		test.strictEqual(Jii.base.Event.hasHandlers(tests.unit.ActiveRecord.className(), 'save'), false);

		test.strictEqual(Jii.base.Event.hasHandlers(tests.unit.User.className(), 'save'), false);
		Jii.base.Event.on(tests.unit.ActiveRecord.className(), 'save', function() {});
		test.strictEqual(Jii.base.Event.hasHandlers(tests.unit.User.className(), 'save'), true);
		test.strictEqual(Jii.base.Event.hasHandlers(tests.unit.ActiveRecord.className(), 'save'), true);

		test.done();
	}

});

/**
 * @class tests.unit.ActiveRecord
 * @extends Jii.base.Component
 */
Jii.defineClass('tests.unit.ActiveRecord', {
	__extends: Jii.base.Component,
	save: function() {
		this.trigger('save');
	}
});

/**
 * @class tests.unit.User
 * @extends tests.unit.ActiveRecord
 */
Jii.defineClass('tests.unit.User', {
	__extends: tests.unit.ActiveRecord
});

/**
 * @class tests.unit.Post
 * @extends tests.unit.ActiveRecord
 */
Jii.defineClass('tests.unit.Post', {
	__extends: tests.unit.ActiveRecord
});

module.exports = new self().exports();
