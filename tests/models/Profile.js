'use strict';

const Jii = require('../../BaseJii');
const ActiveRecord = require('./ActiveRecord.js');
class Profile extends ActiveRecord {

    static tableName() {
        return 'profile';
    }

}
module.exports = Profile;