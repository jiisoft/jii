'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');
class Item extends ActiveRecord {

    static tableName() {
        return 'item';
    }

    getCategory() {
        var Category = require('./Category');
        return this.hasOne(Category, {
            id: 'category_id'
        });
    }

}
module.exports = Item;