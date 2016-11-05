'use strict';

var Jii = require('../../BaseJii');
var Model = require('../../base/Model');

/**
 * @class tests.unit.models.SampleModel
 * @extends Jii.base.Model
 */
var SampleModel = Jii.defineClass('tests.unit.models.SampleModel', {

	__extends: Model,

    _attributes: {
        uid: null,
        name: null,
        description: null
    },

    rules() {
        return [
            // insert
            ['name', 'required', {on: 'insert'}],

            // insert, update
            ['description', 'string', {on: ['insert', 'update'], max: 10}]
        ];
    }

});

module.exports = SampleModel;