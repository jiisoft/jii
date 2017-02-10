'use strict';

const ActiveRecord = require('../../data/ActiveRecord');
class TestActiveRecord extends ActiveRecord {

    static getDb() {
        return ActiveRecord.db;
    }

}

TestActiveRecord.db = null;
module.exports = TestActiveRecord;