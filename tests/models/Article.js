'use strict';

var Jii = require('../../BaseJii');
var BaseActiveRecord = require('../../data/BaseActiveRecord');
var User = require('./User');
var Link = require('./Link');
var LinkJunction = require('./LinkJunction');

/**
 * @class Article
 * @extends Jii.data.BaseActiveRecord
 */
var Article = Jii.defineClass('Article', {

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
        },

        tableName: function() {
            return 'articles';
        }

	},

	getUser: function () {
		return this.hasOne(User, {id: 'userId'});
	},

	getLinks: function () {
		return this.hasMany(Link, {articleId: 'id'});
	},

	getLinksJunction: function () {
		return this.hasMany(LinkJunction, {articleId: 'id'});
	},

    getLinksVia: function () {
        return this.hasMany(Link, {id: 'linkId'}).via('linksJunction');
    }

});

module.exports = Article;