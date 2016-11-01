'use strict';

var Jii = require('../../BaseJii');
var BaseActiveRecord = require('../../data/BaseActiveRecord');

/**
 * @class tests.unit.models.LinkData
 * @extends Jii.data.BaseActiveRecord
 */
var LinkData = Jii.defineClass('tests.unit.models.LinkData', {

	__extends: BaseActiveRecord,

	__static: {

        /**
         * @returns {{}}
         */
        modelSchema: function() {
            return {
                primaryKey: ['id'],
                columns: {
                    id: {
                        jsType: 'number',
                        isPrimaryKey: true
                    },
                    value: 'string'
                }
            };
        }

	}

});

module.exports = LinkData;