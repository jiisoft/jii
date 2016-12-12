'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');
var Item = require('./Item');
class OrderItem extends ActiveRecord {

    static tableName() {
        return 'order_item';
    }

    getOrder() {
        var Order = require('./Order');
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