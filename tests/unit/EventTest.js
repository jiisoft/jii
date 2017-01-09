'use strict';

const Jii = require('../../index');
const UnitTest = require('../../base/UnitTest');
const Event = require('../../base/Event');
const Component = require('../../base/Component');
require('../bootstrap');
class EventTest extends UnitTest {

    preInit() {
        this._counter = null;
        super.preInit(...arguments);
    }

    setUp() {

        // Clear
        this._counter = 0;
        Event.off(Post, 'save');
        Event.off(User, 'save');
        Event.off(TestActiveRecord, 'save');

        return super.setUp();
    }

    onTest(test) {
        Event.on(Post, 'save', function (event) {
            this._counter += 1;
        }.bind(this));
        Event.on(TestActiveRecord, 'save', function (event) {
            this._counter += 3;
        }.bind(this));

        test.strictEqual(this._counter, 0);

        var post = new Post();
        post.save();
        test.strictEqual(this._counter, 4);

        var user = new User();
        user.save();
        test.strictEqual(this._counter, 7);

        test.done();
    }

    offTest(test) {
        var handler = function () {
        };

        test.strictEqual(Event.hasHandlers(Post, 'save'), false);
        Event.on(Post, 'save', handler);
        test.strictEqual(Event.hasHandlers(Post, 'save'), true);
        Event.off(Post, 'save', handler);
        test.strictEqual(Event.hasHandlers(Post, 'save'), false);

        test.done();
    }

    hasTest(test) {
        test.strictEqual(Event.hasHandlers(Post, 'save'), false);
        test.strictEqual(Event.hasHandlers(TestActiveRecord, 'save'), false);

        Event.on(Post, 'save', function () {
        });
        test.strictEqual(Event.hasHandlers(Post, 'save'), true);
        test.strictEqual(Event.hasHandlers(TestActiveRecord, 'save'), false);

        test.strictEqual(Event.hasHandlers(User, 'save'), false);
        Event.on(TestActiveRecord, 'save', function () {
        });
        test.strictEqual(Event.hasHandlers(User, 'save'), true);
        test.strictEqual(Event.hasHandlers(TestActiveRecord, 'save'), true);

        test.done();
    }

    instanceTest(test) {
        var eventTriggerCount = 0;
        var counter = () => {
            return eventTriggerCount;
        };
        var callback = () => {
            eventTriggerCount++;
        };

        // Format: callback
        eventTriggerCount = 0;
        this._onOff(test, callback, counter, callback);

        // Format object
        eventTriggerCount = 0;
        this._onOff(test, {
            callback: callback,
            context: this
        }, counter, callback);

        test.done();
    }

    _onOff(test, onHandler, counter, offHandler) {
        var model = new User();
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

}
class TestActiveRecord extends Component {

    save() {
        this.trigger('save');
    }

}
class User extends TestActiveRecord {

}
class Post extends TestActiveRecord {

}
module.exports = new EventTest().exports();