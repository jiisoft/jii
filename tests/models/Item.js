'use strict';

const Jii = require('../../BaseJii');
const ActiveRecord = require('./ActiveRecord.js');
class Item extends ActiveRecord {

    static tableName() {
        return 'item';
    }

    getCategory() {
        const Category = require('./Category');
        return this.hasOne(Category, {
            id: 'category_id'
        });
    }

}
module.exports = Item;