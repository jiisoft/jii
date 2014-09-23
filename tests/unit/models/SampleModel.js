/**
 * @class tests.unit.models.SampleModel
 * @extends Jii.data.Model
 */
Jii.defineClass('tests.unit.models.SampleModel', {

	__extends: Jii.data.Model,

    _attributes: {
        uid: null,
        name: null,
        description: null
    },

    rules: function () {
        return [
            // insert
            ['name', 'required', {on: 'insert'}],

            // insert, update
            ['description', 'string', {on: ['insert', 'update'], max: 10}]
        ];
    }

});