'use strict';

const Jii = require('../../BaseJii');
const ActiveRecord = require('./ActiveRecord.js');
class OrderWithNullFK extends ActiveRecord {

    static tableName() {
        return 'order_with_null_fk';
    }

}
module.exports = OrderWithNullFK;