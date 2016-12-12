'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');
class NullValues extends ActiveRecord {

    static tableName() {
        return 'null_values';
    }

}
module.exports = NullValues;