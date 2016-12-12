'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');
class OrderItemWithNullFK extends ActiveRecord {

    static tableName() {
        return 'order_item_with_null_fk';
    }

}
module.exports = OrderItemWithNullFK;