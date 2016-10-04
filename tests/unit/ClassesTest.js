'use strict';

var Jii = require('../../index');
var UnitTest = require('../../server/base/UnitTest');
require('./bootstrap');

/**
 * @class tests.unit.ClassesTest
 * @extends Jii.base.UnitTest
 */
var ClassesTest = Jii.defineClass('tests.unit.ClassesTest', {

	__extends: UnitTest,

    aliasesTest: function (test) {
		var Foo = Jii.defineClass('Foo', {
			__static: {
				fooStatic: 2
			},
			foo: 1,
			getVal: function() {
				return 50;
			}
		});
		var fooInstance = new Foo();

		test.strictEqual(fooInstance instanceof Foo, true);
		test.strictEqual(Foo.fooStatic, 2);
		test.strictEqual(fooInstance.foo, 1);
		test.strictEqual(fooInstance.getVal(), 50);
		test.strictEqual(fooInstance.__static, Foo);
		test.strictEqual(fooInstance.__className, 'Foo');
		test.strictEqual(Foo.__className, 'Foo');

		var Bar = Jii.defineClass('Bar', {
			__extends: Foo,
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

		test.strictEqual(barInstance instanceof Bar, true);
		test.strictEqual(barInstance.foo, 3);
		test.strictEqual(barInstance.bar, 4);
		test.strictEqual(Bar.fooStatic, 5);
		test.strictEqual(Bar.barStatic, 6);
		test.strictEqual(barInstance.getVal(), 100);
		test.strictEqual(barInstance.__static, Bar);
		test.strictEqual(barInstance.__className, 'Bar');
		test.strictEqual(Bar.__className, 'Bar');

        test.done();
    }

});

module.exports = new ClassesTest().exports();
