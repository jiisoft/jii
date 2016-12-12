'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');
class Type extends ActiveRecord {

    static tableName() {
        return 'type';
    }

}
module.exports = Type;