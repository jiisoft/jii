'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');
var Item = require('./Item');

/**
 * @class tests.unit.models.OrderItem
 * @extends tests.unit.models.ActiveRecord
 */
var OrderItem = Jii.defineClass('tests.unit.models.OrderItem', {

	__extends: ActiveRecord,

	__static: {

		tableName: function () {
			return 'order_item';
		}

	},

	getOrder: function () {
		var Order = require('./Order');
		return this.hasOne(Order, {id: 'order_id'});
	},

	getItem: function () {
		return this.hasOne(Item, {id: 'item_id'});
	}

});

module.exports = OrderItem;