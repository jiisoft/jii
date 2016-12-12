'use strict';

var Model = require('../../base/Model');

class SampleModel extends Model {

    preInit() {
        super.preInit(...arguments);
        this._attributes = {
            uid: null,
            name: null,
            description: null
        };
    }

    rules() {
        return [
            // insert
            [
                'name',
                'required',
                {
                    on: 'insert'
                }
            ],

            // insert, update
            [
                'description',
                'string',
                {
                    on: [
                        'insert',
                        'update'
                    ],
                    max: 10
                }
            ]
        ];
    }

}
module.exports = SampleModel;