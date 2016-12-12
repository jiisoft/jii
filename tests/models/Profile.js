'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');
class Profile extends ActiveRecord {

    static tableName() {
        return 'profile';
    }

}
module.exports = Profile;