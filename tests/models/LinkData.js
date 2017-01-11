'use strict';

const Jii = require('../../BaseJii');
const BaseActiveRecord = require('../../data/BaseActiveRecord');
class LinkData extends BaseActiveRecord {

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
                value: 'string'
            }
        };
    }

}
module.exports = LinkData;