'use strict';

const Jii = require('../../BaseJii');
const ActiveRecord = require('./ActiveRecord.js');
class OrderItemWithNullFK extends ActiveRecord {

    static tableName() {
        return 'order_item_with_null_fk';
    }

}
module.exports = OrderItemWithNullFK;