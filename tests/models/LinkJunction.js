'use strict';

const Jii = require('../../BaseJii');
const BaseActiveRecord = require('../../data/BaseActiveRecord');
const Link = require('./Link');
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