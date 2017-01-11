'use strict';

const Jii = require('../../BaseJii');
const ActiveRecord = require('./ActiveRecord.js');
class NullValues extends ActiveRecord {

    static tableName() {
        return 'null_values';
    }

}
module.exports = NullValues;