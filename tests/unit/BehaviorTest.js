'use strict';

const Jii = require('../../index');
const UnitTest = require('../../base/UnitTest');
const Component = require('../../base/Component');
const Behavior = require('../../base/Behavior');
require('../bootstrap');
class BehaviorTest extends UnitTest {

    testOn(test) {
        var bar = new BarClass();
        var barBehavior = new BarBehavior();
        bar.attachBehavior('bar', barBehavior);

        test.strictEqual(barBehavior instanceof Behavior, true);
        test.strictEqual(barBehavior.behaviorMethod(), 'behavior method');
        test.strictEqual(bar.getBehavior('bar').behaviorMethod(), 'behavior method');
        test.done();
    }

    testAutomaticAttach(test) {
        var foo = new FooClass();
        test.strictEqual(foo.behaviorMethod(), 'behavior method');
        //test.strictEqual(foo.hasMethod('behaviorMethod'), true);

        test.done();
    }

}
class BarClass extends Component {

}
class FooClass extends Component {

    behaviors() {
        return {
            foo: BarBehavior
        };
    }

}
class BarBehavior extends Behavior {

    preInit() {
        this.behaviorProperty = 'behavior property';
        super.preInit(...arguments);
    }

    behaviorMethod() {
        return 'behavior method';
    }

}
module.exports = new BehaviorTest().exports();