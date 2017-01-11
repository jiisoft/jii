'use strict';

const Jii = require('../../BaseJii');
const BaseActiveRecord = require('../../data/BaseActiveRecord');
class User extends BaseActiveRecord {

    /**
     * @returns {{}}
     */
    static modelSchema() {
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
    }

    static tableName() {
        return 'users';
    }

}
module.exports = User;