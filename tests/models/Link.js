'use strict';

var Jii = require('../../BaseJii');
var BaseActiveRecord = require('../../data/BaseActiveRecord');
var LinkData = require('./LinkData');

/**
 * @class tests.unit.models.Link
 * @extends Jii.data.BaseActiveRecord
 */
var Link = Jii.defineClass('tests.unit.models.Link', {

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
                    articleId: 'number',
                    dataId: 'number',
                    url: 'string',
                    title: 'string'
                }
            };
        }

	},

    getData: function () {
        return this.hasOne(LinkData, {dataId: 'id'});
    }

});

module.exports = Link;