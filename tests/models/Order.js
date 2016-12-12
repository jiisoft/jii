'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');
var OrderItem = require('./OrderItem');
var Item = require('./Item');
var OrderItemWithNullFK = require('./OrderItemWithNullFK');
class Order extends ActiveRecord {

    static tableName() {
        return 'order';
    }

    getCustomer() {
        var Customer = require('./Customer');
        return this.hasOne(Customer, {
            id: 'customer_id'
        });
    }

    getCustomer2() {
        var Customer = require('./Customer');
        return this.hasOne(Customer, {
            id: 'customer_id'
        }).inverseOf('orders2');
    }

    getOrderItems() {
        return this.hasMany(OrderItem, {
            order_id: 'id'
        });
    }

    getOrderItemsWithNullFK() {
        return this.hasMany(OrderItemWithNullFK, {
            order_id: 'id'
        });
    }

    getItems() {
        return this.hasMany(Item, {
            id: 'item_id'
        }).via('orderItems', function(q) {}).orderBy('item.id');
    }

    getItemsIndexed() {
        return this.hasMany(Item, {
            id: 'item_id'
        }).via('orderItems').indexBy('id');
    }

    getItemsWithNullFK() {
        return this.hasMany(Item, {
            id: 'item_id'
        }).viaTable('order_item_with_null_fk', {
            order_id: 'id'
        });
    }

    getItemsInOrder1() {
        return this.hasMany(Item, {
            id: 'item_id'
        }).via('orderItems', function(q) {
            q.orderBy({
                subtotal: 'asc'
            });
        }).orderBy('name');
    }

    getItemsInOrder2() {
        return this.hasMany(Item, {
            id: 'item_id'
        }).via('orderItems', function(q) {
            q.orderBy({
                subtotal: 'desc'
            });
        }).orderBy('name');
    }

    getBooks() {
        return this.hasMany(Item, {
            id: 'item_id'
        }).via('orderItems').where({
            category_id: 1
        });
    }

    getBooksWithNullFK() {
        return this.hasMany(Item, {
            id: 'item_id'
        }).via('orderItemsWithNullFK').where({
            category_id: 1
        });
    }

    getBooksViaTable() {
        return this.hasMany(Item, {
            id: 'item_id'
        }).viaTable('order_item', {
            order_id: 'id'
        }).where({
            category_id: 1
        });
    }

    getBooksWithNullFKViaTable() {
        return this.hasMany(Item, {
            id: 'item_id'
        }).viaTable('order_item_with_null_fk', {
            order_id: 'id'
        }).where({
            category_id: 1
        });
    }

    getBooks2() {
        return this.hasMany(Item, {
            id: 'item_id'
        }).onCondition({
            category_id: 1
        }).viaTable('order_item', {
            order_id: 'id'
        });
    }

    beforeSave(insert) {
        return super.beforeSave(insert).then(function(success) {
            if (!success) {
                return false;
            }

            this.created_at = Math.round(Date.now() / 1000);

            return true;
        }.bind(this));
    }

}
module.exports = Order;