'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');
var Item = require('./Item');
var OrderItem = require('./OrderItem');
var Order = require('./Order');

/**
 * @class tests.unit.models.Category
 * @extends tests.unit.models.ActiveRecord
 */
var Category = Jii.defineClass('tests.unit.models.Category', {

	__extends: ActiveRecord,

	__static: {

		tableName: function () {
			return 'category';
		}

	},

	getItems: function () {
		return this.hasMany(Item, {category_id: 'id'});
	},

	getLimitedItems: function () {
		return this.hasMany(Item, {category_id: 'id'}).onCondition({'item.id': [1, 2, 3]});
	},

	getOrderItems: function () {
		return this.hasMany(OrderItem, {item_id: 'id'}).via('items');
	},

	getOrders: function () {
		return this.hasMany(Order, {id: 'order_id'}).via('orderItems');
	}

});

module.exports = Category;