require('./bootstrap');
require('./models/FakeValidationModel');

/**
 * @class tests.unit.ValidatorTest
 * @extends Jii.base.UnitTest
 */
var self = Jii.defineClass('tests.unit.ValidatorTest', {

	__extends: Jii.base.UnitTest,

    _assertValidation: function(test, validator, values, hasErrors) {
        var model = new tests.unit.models.FakeValidationModel();

        _.each(values, function(value) {
            model.set('foo', value);
            model.clearErrors();

            // Attribute
            validator.validateAttribute(model, 'foo');
            test.strictEqual(model.hasErrors(), hasErrors, 'Attribute errors: ' + model.getErrors('foo'));

            // Value
            test.strictEqual(validator.validateValue(value), !hasErrors, 'Value error, value: ' + value);
        });
    },

    _assertTrue: function(test, validator, values) {
        this._assertValidation(test, validator, values, false);
    },

    _assertFalse: function(test, validator, values) {
        this._assertValidation(test, validator, values, true);
    },

    booleanValidatorTest: function (test) {
        var validator = new Jii.validator.BooleanValidator();
        this._assertTrue(test, validator, [true, false, 1, 0, '1', '0']);
        this._assertFalse(test, validator, ['text..', [], null]);
        validator.strict = true;
        this._assertTrue(test, validator, ['1', '0']);
        this._assertFalse(test, validator, [true, false, 1, 0, 'text..', [], null]);

        test.done();
    },

    compareValidatorTest: function (test) {
        var model = new tests.unit.models.FakeValidationModel();
        model.set('foo', 'test');

        // Attribute
        var validator = new Jii.validator.CompareValidator();
        validator.compareAttribute = 'bar';
        model.set('bar', 'test');
        validator.validateAttribute(model, 'foo');
        test.strictEqual(model.hasErrors(), false);

        var validator = new Jii.validator.CompareValidator();
        validator.compareAttribute = 'bar';
        model.set('bar', 'test222');
        validator.validateAttribute(model, 'foo');
        test.strictEqual(model.hasErrors(), true);

        // Value
        validator.compareValue = 'test';
        test.strictEqual(validator.validateValue('test'), true);
        validator.compareValue = 'test222';
        test.strictEqual(validator.validateValue('test'), false);

        test.done();
    },

    dateValidatorTest: function (test) {
        var validator = new Jii.validator.DateValidator();
        this._assertTrue(test, validator, ['2013-03-04']);
        this._assertFalse(test, validator, ['text..']);

        var model = new tests.unit.models.FakeValidationModel();
        model.set('foo', '2013-03-04');
        validator.timestampAttribute = 'bar';
        validator.validateAttribute(model, 'foo');
        test.strictEqual(model.get('bar'), 1362355200);

        test.done();
    },

    defaultValueValidatorTest: function(test) {
        var model = new tests.unit.models.FakeValidationModel();
        model.set('foo', 'test');

        var validator = new Jii.validator.DefaultValueValidator();
        validator.value = 'test222';
        validator.validateAttribute(model, 'foo');
        test.strictEqual(model.get('foo'), 'test');

        model.set('foo', null);
        validator.validateAttribute(model, 'foo');
        test.strictEqual(model.get('foo'), 'test222');

        test.done();
    },

    emailValidatorTest: function (test) {
        var validator = new Jii.validator.EmailValidator();
        this._assertTrue(test, validator, ['test@example.com']);
        this._assertFalse(test, validator, ['text..']);

        test.done();
    },

    filterValidatorTest: function (test) {
        var model = new tests.unit.models.FakeValidationModel();
        var validator = new Jii.validator.FilterValidator({
            filter: function(value) {
                return value * 2;
            }
        });

        model.set('foo', 5);
        validator.validateAttribute(model, 'foo');
        test.strictEqual(model.get('foo'), 10);

        test.done();
    },

    inlineValidatorTest: function (test) {
        var model = new tests.unit.models.FakeValidationModel();
        model.checkFoo = function(attribute, params) {
            test.strictEqual(params.param1, 'value1');
            this.addError(attribute, 'test error');
        };
        var validator = new Jii.validator.InlineValidator({
            method: 'checkFoo',
            params: {
                param1: 'value1'
            }
        });

        validator.validateAttribute(model, 'foo');
        test.strictEqual(model.hasErrors('foo'), true);

        test.done();
    },

    numberValidatorTest: function (test) {
		var validator;

        validator = new Jii.validator.NumberValidator();
        this._assertTrue(test, validator, [20, 0, -20, '20', 25.45]);
        this._assertFalse(test, validator, ['25,45', '12:45']);

        validator.integerOnly = true;
        this._assertTrue(test, validator, [20, 0, -20, '20', '020', 0x14]);
        this._assertFalse(test, validator, [25.45, '25,45', '0x14']);


        validator = new Jii.validator.NumberValidator({
            min: -10,
            max: 5
        });
        this._assertTrue(test, validator, [-10, -3, 0, 3, 5]);
        this._assertFalse(test, validator, [-11, 6, 100]);

        test.done();
    },

    rangeValidatorTest: function (test) {
        var validator = new Jii.validator.RangeValidator({
            range: [1, 2, 'test']
        });
        this._assertTrue(test, validator, [1, 2, '1', '2', 'test']);
        this._assertFalse(test, validator, [3, 'text..']);

        validator.strict = true;
        this._assertTrue(test, validator, [1, 2, 'test']);
        this._assertFalse(test, validator, ['1', '2', 'text..']);

        validator.not = true;
        this._assertTrue(test, validator, ['1', '2', 'text..']);
        this._assertFalse(test, validator, [1, 2, 'test']);

        test.done();
    },

    regularExpressionValidatorTest: function (test) {
        var validator = new Jii.validator.RegularExpressionValidator({
            pattern: /^[a-z]+[0-9]$/
        });
        this._assertTrue(test, validator, ['aaa4', 'a1']);
        this._assertFalse(test, validator, ['qwe123', 'bbb']);

        validator.not = true;
        this._assertFalse(test, validator, ['aaa4', 'a1']);
        this._assertTrue(test, validator, ['qwe123', 'bbb']);

        test.done();
    },

    requiredValidatorTest: function (test) {
        var model = new tests.unit.models.FakeValidationModel();
        var validator = new Jii.validator.RequiredValidator();

        model.set('foo', 'text..');
        validator.validateAttribute(model, 'foo');
        test.strictEqual(model.hasErrors('foo'), false);

        model.set('foo', null);
        validator.validateAttribute(model, 'foo');
        test.strictEqual(model.hasErrors('foo'), true);

        test.done();
    },

    safeValidatorTest: function (test) {
        var model = new tests.unit.models.FakeValidationModel();
        var validator = new Jii.validator.SafeValidator();

        validator.validateAttribute(model, 'foo');
        test.strictEqual(model.hasErrors(), false);

        test.done();
    },

    stringValidatorTest: function (test) {
		var validator;

        validator = new Jii.validator.StringValidator({
            length: 4
        });
        this._assertTrue(test, validator, ['aaaa', '€€€€']);
        this._assertFalse(test, validator, ['aa', 'q']);

        validator = new Jii.validator.StringValidator({
            length: [4]
        });
        this._assertTrue(test, validator, ['aaaa', 'aaabbb']);
        this._assertFalse(test, validator, ['aa', '']);

        validator = new Jii.validator.StringValidator({
            length: [1, 5]
        });
        this._assertTrue(test, validator, ['a', 'aa', 'aaaaa']);
        this._assertFalse(test, validator, ['', 'aaabbb']);

        validator = new Jii.validator.StringValidator({
            length: [3, 8],
            min: 1,
            max: 5
        });
        this._assertTrue(test, validator, ['aaa', 'aaaabbbb']);
        this._assertFalse(test, validator, ['', 'aa']);

        test.done();
    },

    urlValidatorTest: function (test) {
		var validator;

        validator = new Jii.validator.UrlValidator();
        this._assertTrue(test, validator, ['http://google.de', 'https://google.de', 'https://www.google.de/search?q=yii+framework&ie=utf-8&oe=utf-8&rls=org.mozilla:de:official&client=firefox-a&gws_rd=cr']);
        this._assertFalse(test, validator, ['google.de', 'htp://yiiframework.com', 'ftp://ftp.ruhr-uni-bochum.de/', 'http://invalid,domain', 'http://äüö?=!"§$%&/()=}][{³²€.edu']);

        validator = new Jii.validator.UrlValidator({
            defaultScheme: 'https'
        });
        this._assertTrue(test, validator, ['yiiframework.com', 'http://yiiframework.com']);

        test.done();
    }

});

module.exports = new self().exports();
