'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');
var OrderItem = require('./OrderItem');
var Item = require('./Item');
var OrderItemWithNullFK = require('./OrderItemWithNullFK');

/**
 * @class tests.unit.models.Order
 * @extends tests.unit.models.ActiveRecord
 */
var Order = Jii.defineClass('tests.unit.models.Order', {

	__extends: ActiveRecord,

	__static: {

		tableName: function () {
			return 'order';
		}

	},

	getCustomer: function () {
		var Customer = require('./Customer');
		return this.hasOne(Customer, {id: 'customer_id'});
	},

	getCustomer2: function () {
		var Customer = require('./Customer');
		return this.hasOne(Customer, {id: 'customer_id'}).inverseOf('orders2');
	},

	getOrderItems: function () {
		return this.hasMany(OrderItem, {order_id: 'id'});
	},

	getOrderItemsWithNullFK: function () {
		return this.hasMany(OrderItemWithNullFK, {order_id: 'id'});
	},

	getItems: function () {
		return this.hasMany(Item, {id: 'item_id'})
			.via('orderItems', function (q) {
				// additional query configuration
			}).orderBy('item.id');
	},

	getItemsIndexed: function () {
		return this.hasMany(Item, {id: 'item_id'})
			.via('orderItems').indexBy('id');
	},

	getItemsWithNullFK: function () {
		return this.hasMany(Item, {id: 'item_id'})
			.viaTable('order_item_with_null_fk', {order_id: 'id'});
	},

	getItemsInOrder1: function () {
		return this.hasMany(Item, {id: 'item_id'})
			.via('orderItems', function (q) {
				q.orderBy({subtotal: 'asc'});
			}).orderBy('name');
	},

	getItemsInOrder2: function () {
		return this.hasMany(Item, {id: 'item_id'})
			.via('orderItems', function (q) {
				q.orderBy({subtotal: 'desc'});
			}).orderBy('name');
	},

	getBooks: function () {
		return this.hasMany(Item, {id: 'item_id'})
			.via('orderItems')
			.where({category_id: 1});
	},

	getBooksWithNullFK: function () {
		return this.hasMany(Item, {id: 'item_id'})
			.via('orderItemsWithNullFK')
			.where({category_id: 1});
	},

	getBooksViaTable: function () {
		return this.hasMany(Item, {id: 'item_id'})
			.viaTable('order_item', {order_id: 'id'})
			.where({category_id: 1});
	},

	getBooksWithNullFKViaTable: function () {
		return this.hasMany(Item, {id: 'item_id'})
			.viaTable('order_item_with_null_fk', {order_id: 'id'})
			.where({category_id: 1});
	},

	getBooks2: function () {
		return this.hasMany(Item, {id: 'item_id'})
			.onCondition({category_id: 1})
			.viaTable('order_item', {order_id: 'id'});
	},

	beforeSave: function (insert) {
		return this.__super(insert).then(function(success) {
			if (!success) {
				return false;
			}

			this.created_at = Math.round(Date.now() / 1000);

			return true;
		}.bind(this));
	}

});

module.exports = Order;