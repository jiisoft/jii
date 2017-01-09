'use strict';

const Jii = require('../../BaseJii');
const ActiveRecord = require('./ActiveRecord.js');
const Item = require('./Item');
const OrderItem = require('./OrderItem');
const Order = require('./Order');
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