'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');

/**
 * @class tests.unit.models.Item
 * @extends tests.unit.models.ActiveRecord
 */
var Item = Jii.defineClass('tests.unit.models.Item', {

	__extends: ActiveRecord,

	__static: {

		tableName() {
			return 'item';
		}

	},

	getCategory() {
		var Category = require('./Category');
		return this.hasOne(Category, {id: 'category_id'});
	}

});

module.exports = Item;