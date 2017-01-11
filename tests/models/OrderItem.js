'use strict';

const Jii = require('../../BaseJii');
const ActiveRecord = require('./ActiveRecord.js');
const Item = require('./Item');
class OrderItem extends ActiveRecord {

    static tableName() {
        return 'order_item';
    }

    getOrder() {
        const Order = require('./Order');
        return this.hasOne(Order, {
            id: 'order_id'
        });
    }

    getItem() {
        return this.hasOne(Item, {
            id: 'item_id'
        });
    }

}
module.exports = OrderItem;