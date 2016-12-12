'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');
var Item = require('./Item');
var OrderItem = require('./OrderItem');
var Order = require('./Order');
class Category extends ActiveRecord {

    static tableName() {
        return 'category';
    }

    getItems() {
        return this.hasMany(Item, {
            category_id: 'id'
        });
    }

    getLimitedItems() {
        return this.hasMany(Item, {
            category_id: 'id'
        }).onCondition({
            'item.id': [
                1,
                2,
                3
            ]
        });
    }

    getOrderItems() {
        return this.hasMany(OrderItem, {
            item_id: 'id'
        }).via('items');
    }

    getOrders() {
        return this.hasMany(Order, {
            id: 'order_id'
        }).via('orderItems');
    }

}
module.exports = Category;