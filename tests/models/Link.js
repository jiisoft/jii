'use strict';

const Jii = require('../../BaseJii');
const BaseActiveRecord = require('../../data/BaseActiveRecord');
const LinkData = require('./LinkData');
class Link extends BaseActiveRecord {

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
                articleId: 'number',
                dataId: 'number',
                url: 'string',
                title: 'string'
            }
        };
    }

    getData() {
        return this.hasOne(LinkData, {
            dataId: 'id'
        });
    }

}
module.exports = Link;