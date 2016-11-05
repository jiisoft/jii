'use strict';

var Jii = require('../../BaseJii');
var BaseActiveRecord = require('../../data/BaseActiveRecord');
var Link = require('./Link');

/**
 * @class tests.unit.models.LinkJunction
 * @extends Jii.data.BaseActiveRecord
 */
var LinkJunction = Jii.defineClass('tests.unit.models.LinkJunction', {

	__extends: BaseActiveRecord,

	__static: {

        /**
         * @returns {{}}
         */
        modelSchema: function() {
            return {
                primaryKey: ['articleId', 'linkId'],
                columns: {
                    articleId: 'number',
                    linkId: 'number'
                }
            };
        }

	},

    getLink() {
        return this.hasOne(Link, {id: 'linkId'});
    }

});

module.exports = LinkJunction;