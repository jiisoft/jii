'use strict';

const BaseActiveRecord = require('../../data/BaseActiveRecord');
const User = require('./User');
const Link = require('./Link');
const LinkJunction = require('./LinkJunction');

class Article extends BaseActiveRecord {

    /**
     * @returns {{}}
     */
    static modelSchema() {
        return {
            primaryKey: ['id'],
            columns: {
                id: {
                    name: 'id',
                    jsType: 'number',
                    isPrimaryKey: true
                },
                userId: 'number',
                title: 'string',
                text: 'string',
                createTime: 'number'
            }
        };
    }

    static tableName() {
        return 'articles';
    }

    getUser() {
        return this.hasOne(User, {
            id: 'userId'
        });
    }

    getLinks() {
        return this.hasMany(Link, {
            articleId: 'id'
        });
    }

    getLinksJunction() {
        return this.hasMany(LinkJunction, {
            articleId: 'id'
        });
    }

    getLinksVia() {
        return this.hasMany(Link, {
            id: 'linkId'
        }).via('linksJunction');
    }

}
module.exports = Article;