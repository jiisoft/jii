require('./bootstrap');
require('./models/SampleModel');

/**
 * @class tests.unit.ModelTest
 * @extends Jii.base.UnitTest
 */
var self = Jii.defineClass('tests.unit.ModelTest', {

	__extends: Jii.base.UnitTest,

    _getModelInstances: function () {
        return [
            new tests.unit.models.SampleModel()
        ];
    },

    setterTest: function (test) {
        _.each(this._getModelInstances(), function (sampleModel) {
            // Check insert scenario (set name and description)
            sampleModel.setScenario('insert');
            sampleModel.setAttributes({
                name: 'Ivan',
                description: 'Developer'
            });
            test.strictEqual(sampleModel.get('name'), 'Ivan');
            test.strictEqual(sampleModel.get('description'), 'Developer');

            // Check update scenario (can only set description)
            sampleModel.setScenario('update');
            sampleModel.setAttributes({
                name: 'John',
                description: 'Project manager'
            });
            test.strictEqual(sampleModel.get('name'), 'Ivan');
            test.strictEqual(sampleModel.get('description'), 'Project manager');

            // Check try set unknow attribute
            test.throws(function () {
                sampleModel.set('unknow', '...');
            }, Jii.exceptions.ApplicationException);
        });

        test.done();
    },

    validateTest: function (test) {
        _.each(this._getModelInstances(), function (sampleModel) {
            sampleModel.setScenario('insert');
            sampleModel.set('description', '1234567890+1');
            sampleModel.validate().then(function (isValid) {

                // Check validation errors
                test.strictEqual(isValid, false);
                test.strictEqual(sampleModel.hasErrors(), true);
                test.strictEqual(_.keys(sampleModel.getErrors()).length, 2);
                test.strictEqual(sampleModel.getErrors().name.length, 1); // Required error
                test.strictEqual(sampleModel.getErrors().description.length, 1); // Length error

                // Add custom error
                sampleModel.addError('uid', 'Error text..');
                sampleModel.addError('name', 'Error text..');
                test.strictEqual(_.keys(sampleModel.getErrors()).length, 3);
                test.strictEqual(sampleModel.getErrors().name.length, 2);

                // Clear errors
                sampleModel.clearErrors();
                test.strictEqual(_.keys(sampleModel.getErrors()).length, 0);
            });
        });

        test.done();
    }

});

module.exports = new self().exports();
