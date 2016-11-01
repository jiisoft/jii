'use strict';

var Jii = require('../../BaseJii');
var BaseActiveRecord = require('../../data/BaseActiveRecord');

/**
 * @class tests.unit.models.User
 * @extends Jii.data.BaseActiveRecord
 */
var User = Jii.defineClass('tests.unit.models.User', {

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
                    name: 'string',
                    email: 'string'
                }
            };
        },

        tableName: function() {
            return 'users';
        }

	}

});

module.exports = User;