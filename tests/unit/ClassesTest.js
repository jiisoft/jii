'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('../../index');
require('./bootstrap');

var tests = Jii.namespace('tests');

/**
 * @class tests.unit.ClassesTest
 * @extends Jii.base.UnitTest
 */
var self = Jii.defineClass('tests.unit.ClassesTest', {

	__extends: 'Jii.base.UnitTest',

    aliasesTest: function (test) {
		var Foo = Jii.defineClass('tests.Foo', {
			__static: {
				fooStatic: 2
			},
			foo: 1,
			getVal: function() {
				return 50;
			}
		});
		var fooInstance = new Foo();

		test.strictEqual(Jii.namespace('tests.Foo'), Foo);
		test.strictEqual(fooInstance instanceof tests.Foo, true);
		test.strictEqual(tests.Foo.fooStatic, 2);
		test.strictEqual(fooInstance.foo, 1);
		test.strictEqual(fooInstance.getVal(), 50);
		test.strictEqual(fooInstance.__static, Foo);
		test.strictEqual(fooInstance.__className, 'tests.Foo');
		test.strictEqual(tests.Foo.__className, 'tests.Foo');

		var Bar = Jii.defineClass('tests.Bar', {
			__extends: 'tests.Foo',
			__static: {
				fooStatic: 5,
				barStatic: 6
			},
			foo: 3,
			bar: 4,
			getVal: function() {
				return this.__super() * 2;
			}
		});
		var barInstance = new Bar();

		test.strictEqual(barInstance instanceof tests.Bar, true);
		test.strictEqual(barInstance.foo, 3);
		test.strictEqual(barInstance.bar, 4);
		test.strictEqual(tests.Bar.fooStatic, 5);
		test.strictEqual(tests.Bar.barStatic, 6);
		test.strictEqual(barInstance.getVal(), 100);
		test.strictEqual(barInstance.__static, Bar);
		test.strictEqual(barInstance.__className, 'tests.Bar');
		test.strictEqual(tests.Bar.__className, 'tests.Bar');

        test.done();
    }

});

module.exports = new self().exports();
