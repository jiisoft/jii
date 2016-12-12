'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('../../data/ActiveRecord');
class TestActiveRecord extends ActiveRecord {

    static getDb() {
        return ActiveRecord.db;
    }

}

TestActiveRecord.db = null;
module.exports = TestActiveRecord;