'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('../../index');
require('./bootstrap');

var tests = Jii.namespace('tests');

/**
 * @class tests.unit.BehaviorTest
 * @extends Jii.base.UnitTest
 */
var self = Jii.defineClass('tests.unit.BehaviorTest', {

	__extends: Jii.base.UnitTest,

	testOn: function (test) {
		var bar = new tests.unit.BarClass();
		var barBehavior = new tests.unit.BarBehavior();
		bar.attachBehavior('bar', barBehavior);

		test.strictEqual(barBehavior.behaviorMethod(), 'behavior method');
		test.strictEqual(bar.getBehavior('bar').behaviorMethod(), 'behavior method');
		test.done();
	},

	testAutomaticAttach: function(test) {
		var foo = new tests.unit.FooClass();
		test.strictEqual(foo.behaviorMethod(), 'behavior method');
		//test.strictEqual(foo.hasMethod('behaviorMethod'), true);

		test.done();
	}

});

/**
 * @class tests.unit.BarClass
 * @extends Jii.base.Component
 */
Jii.defineClass('tests.unit.BarClass', {
	__extends: Jii.base.Component
});

/**
 * @class tests.unit.FooClass
 * @extends Jii.base.Component
 */
Jii.defineClass('tests.unit.FooClass', {
	__extends: Jii.base.Component,
	behaviors: function() {
		return {
			foo: 'tests.unit.BarBehavior'
		};
	}
});

/**
 * @class tests.unit.BarBehavior
 * @extends Jii.base.Behavior
 */
Jii.defineClass('tests.unit.BarBehavior', {
	__extends: Jii.base.Behavior,
	behaviorProperty: 'behavior property',
	behaviorMethod: function() {
		return 'behavior method';
	}
});

module.exports = new self().exports();
