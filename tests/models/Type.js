'use strict';

const Jii = require('../../BaseJii');
const ActiveRecord = require('./ActiveRecord.js');
class Type extends ActiveRecord {

    static tableName() {
        return 'type';
    }

}
module.exports = Type;