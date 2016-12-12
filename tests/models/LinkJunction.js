'use strict';

var Jii = require('../../BaseJii');
var BaseActiveRecord = require('../../data/BaseActiveRecord');
var Link = require('./Link');
class LinkJunction extends BaseActiveRecord {

    /**
         * @returns {{}}
         */
    static modelSchema() {
        return {
            primaryKey: [
                'articleId',
                'linkId'
            ],
            columns: {
                articleId: 'number',
                linkId: 'number'
            }
        };
    }

    getLink() {
        return this.hasOne(Link, {
            id: 'linkId'
        });
    }

}
module.exports = LinkJunction;