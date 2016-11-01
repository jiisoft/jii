'use strict';

var Jii = require('../../BaseJii');
var Model = require('../../base/Model');

/**
 * @class tests.unit.models.FakeValidationModel
 * @extends Jii.base.Model
 */
var FakeValidationModel = Jii.defineClass('tests.unit.models.FakeValidationModel', {

	__extends: Model,

    _attributes: {
        foo: null,
        bar: null
    }

});

module.exports = FakeValidationModel;