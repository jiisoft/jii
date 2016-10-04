'use strict';

var Jii = require('../../index');
var UnitTest = require('../../server/base/UnitTest');
var Component = require('../../base/Component');
var Behavior = require('../../base/Behavior');
require('./bootstrap');

/**
 * @class BehaviorTest
 * @extends UnitTest
 */
var BehaviorTest = Jii.defineClass('BehaviorTest', {

	__extends: UnitTest,

	testOn: function (test) {
		var bar = new BarClass();
		var barBehavior = new BarBehavior();
		bar.attachBehavior('bar', barBehavior);

		test.strictEqual(barBehavior instanceof Behavior, true);
		test.strictEqual(barBehavior.behaviorMethod(), 'behavior method');
		test.strictEqual(bar.getBehavior('bar').behaviorMethod(), 'behavior method');
		test.done();
	},

	testAutomaticAttach: function(test) {
		var foo = new FooClass();
		test.strictEqual(foo.behaviorMethod(), 'behavior method');
		//test.strictEqual(foo.hasMethod('behaviorMethod'), true);

		test.done();
	}

});

/**
 * @class BarClass
 * @extends Component
 */
var BarClass = Jii.defineClass('BarClass', {
	__extends: Component
});

/**
 * @class FooClass
 * @extends Component
 */
var FooClass = Jii.defineClass('FooClass', {
	__extends: Component,
	behaviors: function() {
		return {
			foo: BarBehavior
		};
	}
});

/**
 * @class BarBehavior
 * @extends Behavior
 */
var BarBehavior = Jii.defineClass('BarBehavior', {
	__extends: Behavior,
	behaviorProperty: 'behavior property',
	behaviorMethod: function() {
		return 'behavior method';
	}
});

module.exports = new BehaviorTest().exports();
