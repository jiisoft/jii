'use strict';

const Jii = require('../../BaseJii');
const ActiveRecord = require('./ActiveRecord.js');
const CustomerQuery = require('./CustomerQuery.js');
const Profile = require('./Profile.js');
const Order = require('./Order.js');
const OrderWithNullFK = require('./OrderWithNullFK.js');
const Item = require('./Item.js');
class Customer extends ActiveRecord {

    preInit() {
        this.status2 = null;
        super.preInit(...arguments);
    }

    static tableName() {
        return 'customer';
    }

    /**
     * @inheritdoc
     * @returns {CustomerQuery}
     */
    static find() {
        return new CustomerQuery(this);
    }

    getProfile() {
        return this.hasOne(Profile, {
            id: 'profile_id'
        });
    }

    getOrders() {
        return this.hasMany(Order, {
            customer_id: 'id'
        }).orderBy('id');
    }

    getExpensiveOrders() {
        return this.hasMany(Order, {
            customer_id: 'id'
        }).andWhere('total > 50').orderBy('id');
    }

    getExpensiveOrdersWithNullFK() {
        return this.hasMany(OrderWithNullFK, {
            customer_id: 'id'
        }).andWhere('total > 50').orderBy('id');
    }

    getOrdersWithNullFK() {
        return this.hasMany(OrderWithNullFK, {
            customer_id: 'id'
        }).orderBy('id');
    }

    getOrders2() {
        return this.hasMany(Order, {
            customer_id: 'id'
        }).inverseOf('customer2').orderBy('id');
    }

    // deeply nested table relation
    getOrderItems() {
        /** @typedef {Jii.data.ActiveQuery} rel */
        var rel = this.hasMany(Item, {
            id: 'item_id'
        });

        return rel.viaTable('order_item', {
            order_id: 'id'
        }, function (q) {
            /** @typedef {Jii.data.ActiveQuery} q */
            q.viaTable('order', {
                customer_id: 'id'
            });
        }).orderBy('id');
    }

    afterSave(insert, changedAttributes) {
        Jii.__afterSaveInsert = insert;
        Jii.__afterSaveNewRecord = this.isNewRecord();
        return super.afterSave(insert, changedAttributes);
    }

}
Customer.STATUS_INACTIVE = 2;

Customer.STATUS_ACTIVE = 1;
module.exports = Customer;