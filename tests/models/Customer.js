'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');
var CustomerQuery = require('./CustomerQuery.js');
var Profile = require('./Profile.js');
var Order = require('./Order.js');
var OrderWithNullFK = require('./OrderWithNullFK.js');
var Item = require('./Item.js');

/**
 * @class tests.unit.models.Customer
 * @extends tests.unit.models.ActiveRecord
 */
var Customer = Jii.defineClass('tests.unit.models.Customer', {

	__extends: ActiveRecord,

	__static: {

		STATUS_ACTIVE: 1,
		STATUS_INACTIVE: 2,

		tableName() {
			return 'customer';
		},

		/**
		 * @inheritdoc
		 * @returns {CustomerQuery}
		 */
		find() {
			return new CustomerQuery(this);
		}

	},

	status2: null,

	getProfile() {
		return this.hasOne(Profile, {id: 'profile_id'});
	},

	getOrders() {
		return this.hasMany(Order, {customer_id: 'id'}).orderBy('id');
	},

	getExpensiveOrders() {
		return this.hasMany(Order, {customer_id: 'id'}).andWhere('total > 50').orderBy('id');
	},

	getExpensiveOrdersWithNullFK() {
		return this.hasMany(OrderWithNullFK, {customer_id: 'id'}).andWhere('total > 50').orderBy('id');
	},

	getOrdersWithNullFK() {
		return this.hasMany(OrderWithNullFK, {customer_id: 'id'}).orderBy('id');
	},

	getOrders2() {
		return this.hasMany(Order, {customer_id: 'id'}).inverseOf('customer2').orderBy('id');
	},

	// deeply nested table relation
	getOrderItems() {
		/** @typedef {Jii.data.ActiveQuery} rel */
		var rel = this.hasMany(Item, {id: 'item_id'});

		return rel.viaTable('order_item', {order_id: 'id'}, function (q) {
			/** @typedef {Jii.data.ActiveQuery} q */
			q.viaTable('order', {customer_id: 'id'});
		}).orderBy('id');
	},

	afterSave(insert, changedAttributes) {
		Jii.__afterSaveInsert = insert;
        Jii.__afterSaveNewRecord = this.isNewRecord();
		return this.__super(insert, changedAttributes);
	}

});

module.exports = Customer;