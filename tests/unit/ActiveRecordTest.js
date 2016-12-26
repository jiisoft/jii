'use strict';

var Jii = require('../../BaseJii');
var Event = require('../../base/Event');
var ActiveRecord = require('../../data/ActiveRecord');
var ActiveQuery = require('../../data/ActiveQuery');
var _has = require('lodash/has');
var _keys = require('lodash/keys');
var _isObject = require('lodash/isObject');
var _isEmpty = require('lodash/isEmpty');
var _trim = require('lodash/trim');
var Category = require('../models/Category.js');
var Customer = require('../models/Customer.js');
var Item = require('../models/Item.js');
var NullValues = require('../models/NullValues.js');
var Order = require('../models/Order.js');
var OrderItem = require('../models/OrderItem.js');
var OrderWithNullFK = require('../models/OrderWithNullFK.js');
var OrderItemWithNullFK = require('../models/OrderItemWithNullFK.js');
var Profile = require('../models/Profile.js');
var Type = require('../models/Type.js');
var DatabaseTestCase = require('../DatabaseTestCase.js');
class self extends DatabaseTestCase {

    setUp() {

        return Promise.all([
            super.setUp(),
            this.getConnection()
        ]).then(function (results) {
            ActiveRecord.db = results[1];
        });
    }

    tearDown() {
        ActiveRecord.db = null;
        return super.tearDown();
    }

    getCustomerClass() {
        return Customer;
    }

    getItemClass() {
        return Item;
    }

    getOrderClass() {
        return Order;
    }

    getOrderItemClass() {
        return OrderItem;
    }

    getOrderWithNullFKClass() {
        return OrderWithNullFK;
    }

    getOrderItemWithNullFKmClass() {
        return OrderItemWithNullFK;
    }

    afterSave() {
    }

    testFind(test) {
        /** @typedef Jii.data.ActiveRecord customerClass */
        var customerClass = this.getCustomerClass();

        var result = customerClass.find();

        test.ok(result instanceof ActiveQuery);

        // find one
        result.one().then(function (customer) {
            test.ok(customer instanceof customerClass);

            // find all
            return customerClass.find().all();
        }).then(function (customers) {
            test.strictEqual(3, customers.length);
            test.ok(customers[0] instanceof customerClass);
            test.ok(customers[1] instanceof customerClass);
            test.ok(customers[2] instanceof customerClass);

            // find by a single primary key
            return customerClass.findOne(2);
        }).then(function (customer) {
            test.ok(customer instanceof customerClass);
            test.strictEqual('user2', customer.get('name'));

            return customerClass.findOne(5);
        }).then(function (customer) {
            test.strictEqual(null, customer);

            return customerClass.findOne({
                id: [
                    5,
                    6,
                    1
                ]
            });
        }).then(function (customer) {
            test.ok(customer instanceof customerClass);
            test.notStrictEqual(null, customer);

            return customerClass.find().where({
                id: [
                    5,
                    6,
                    1
                ]
            }).one();
        }).then(function (customer) {
            test.notStrictEqual(null, customer);

            // find by column values
            return customerClass.findOne({
                id: 2,
                name: 'user2'
            });
        }).then(function (customer) {
            test.ok(customer instanceof customerClass);
            test.strictEqual('user2', customer.get('name'));

            return customerClass.findOne({
                id: 2,
                name: 'user1'
            });
        }).then(function (customer) {
            test.strictEqual(null, customer);

            return customerClass.findOne({
                id: 5
            });
        }).then(function (customer) {
            test.strictEqual(null, customer);

            return customerClass.findOne({
                name: 'user5'
            });
        }).then(function (customer) {
            test.strictEqual(null, customer);

            // find by attributes
            return customerClass.find().where({
                name: 'user2'
            }).one();
        }).then(function (customer) {
            test.ok(customer instanceof customerClass);
            test.equal(2, customer.get('id'));

            // scope
            return customerClass.find().active().all();
        }).then(function (customers) {
            test.strictEqual(2, customers.length);

            return customerClass.find().active().count();
        }).then(function (count) {
            test.strictEqual(2, count);

            test.done();
        });
    }

    testFindAsArray(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        // asArray
        customerClass.find().where({
            id: 2
        }).asArray().one().then(function (customer) {
            test.deepEqual({
                id: 2,
                email: 'user2@example.com',
                name: 'user2',
                address: 'address2',
                status: 1,
                profile_id: null
            }, customer);

            // find all asArray
            return customerClass.find().asArray().all();
        }).then(function (customers) {
            test.strictEqual(3, customers.length);
            test.ok(_has(customers[0], 'id'));
            test.ok(_has(customers[0], 'name'));
            test.ok(_has(customers[0], 'email'));
            test.ok(_has(customers[0], 'address'));
            test.ok(_has(customers[0], 'status'));
            test.ok(_has(customers[1], 'id'));
            test.ok(_has(customers[1], 'name'));
            test.ok(_has(customers[1], 'email'));
            test.ok(_has(customers[1], 'address'));
            test.ok(_has(customers[1], 'status'));
            test.ok(_has(customers[2], 'id'));
            test.ok(_has(customers[2], 'name'));
            test.ok(_has(customers[2], 'email'));
            test.ok(_has(customers[2], 'address'));
            test.ok(_has(customers[2], 'status'));

            test.done();
        });
    }

    testFindScalar(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        // query scalar
        customerClass.find().where({
            id: 2
        }).select('name').scalar().then(function (customerName) {
            test.strictEqual('user2', customerName);

            return customerClass.find().where({
                status: 2
            }).select('name').scalar();
        }).then(function (customerName) {
            test.strictEqual('user3', customerName);

            return customerClass.find().where({
                status: 2
            }).select('noname').scalar();
        }).then(function (customerName) {
            test.strictEqual(false, customerName);

            return customerClass.find().where({
                status: 2
            }).select('id').scalar();
        }).then(function (customerId) {
            test.equal(3, customerId);

            test.done();
        });
    }

    testFindColumn(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        customerClass.find().orderBy({
            name: 'asc'
        }).select('name').column().then(function (column) {
            test.deepEqual([
                'user1',
                'user2',
                'user3'
            ], column);

            return customerClass.find().orderBy({
                name: 'desc'
            }).select('name').column();
        }).then(function (column) {
            test.deepEqual([
                'user3',
                'user2',
                'user1'
            ], column);

            test.done();
        });
    }

    testFindIndexBy(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        // indexBy
        customerClass.find().indexBy('name').orderBy('id').all().then(function (customers) {
            test.strictEqual(3, _keys(customers).length);
            test.ok(customers['user1'] instanceof customerClass);
            test.ok(customers['user2'] instanceof customerClass);
            test.ok(customers['user3'] instanceof customerClass);

            // indexBy callable
            return customerClass.find().indexBy(function (customer) {
                return customer.get('id') + '-' + customer.get('name');
            }).orderBy('id').all();
        }).then(function (customers) {
            test.strictEqual(3, _keys(customers).length);
            test.ok(customers['1-user1'] instanceof customerClass);
            test.ok(customers['2-user2'] instanceof customerClass);
            test.ok(customers['3-user3'] instanceof customerClass);

            test.done();
        });
    }

    testFindIndexByAsArray(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        // indexBy + asArray
        customerClass.find().asArray().indexBy('name').all().then(function (customers) {
            test.strictEqual(3, _keys(customers).length);
            test.ok(_has(customers['user1'], 'id'));
            test.ok(_has(customers['user1'], 'name'));
            test.ok(_has(customers['user1'], 'email'));
            test.ok(_has(customers['user1'], 'address'));
            test.ok(_has(customers['user1'], 'status'));
            test.ok(_has(customers['user2'], 'id'));
            test.ok(_has(customers['user2'], 'name'));
            test.ok(_has(customers['user2'], 'email'));
            test.ok(_has(customers['user2'], 'address'));
            test.ok(_has(customers['user2'], 'status'));
            test.ok(_has(customers['user3'], 'id'));
            test.ok(_has(customers['user3'], 'name'));
            test.ok(_has(customers['user3'], 'email'));
            test.ok(_has(customers['user3'], 'address'));
            test.ok(_has(customers['user3'], 'status'));

            // indexBy callable + asArray
            return customerClass.find().indexBy(function (customer) {
                return customer['id'] + '-' + customer['name'];
            }).asArray().all();
        }).then(function (customers) {
            test.strictEqual(3, _keys(customers).length);
            test.ok(_has(customers['1-user1'], 'id'));
            test.ok(_has(customers['1-user1'], 'name'));
            test.ok(_has(customers['1-user1'], 'email'));
            test.ok(_has(customers['1-user1'], 'address'));
            test.ok(_has(customers['1-user1'], 'status'));
            test.ok(_has(customers['2-user2'], 'id'));
            test.ok(_has(customers['2-user2'], 'name'));
            test.ok(_has(customers['2-user2'], 'email'));
            test.ok(_has(customers['2-user2'], 'address'));
            test.ok(_has(customers['2-user2'], 'status'));
            test.ok(_has(customers['3-user3'], 'id'));
            test.ok(_has(customers['3-user3'], 'name'));
            test.ok(_has(customers['3-user3'], 'email'));
            test.ok(_has(customers['3-user3'], 'address'));
            test.ok(_has(customers['3-user3'], 'status'));

            test.done();
        });
    }

    testRefresh(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        var customer = new customerClass();
        customer.refresh().then(function (result) {
            test.ok(!result);

            return customerClass.findOne(1);
        }).then(function (c) {
            customer = c;
            customer.set('name', 'to be refreshed');

            return customer.refresh();
        }).then(function (result) {
            test.ok(result);
            test.strictEqual('user1', customer.get('name'));

            test.done();
        });
    }

    testEquals(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        /** @typedef {Jii.data.ActiveRecord} itemClass */
        var itemClass = this.getItemClass();

        var customerA,
            customerB;

        customerA = new customerClass();
        customerB = new customerClass();
        test.strictEqual(false, customerA.equals(customerB));

        customerA = new customerClass();
        customerB = new itemClass();
        test.strictEqual(false, customerA.equals(customerB));

        Promise.all([
            customerClass.findOne(1),
            customerClass.findOne(2)
        ]).then(function (args) {
            customerA = args[0];
            customerB = args[1];

            test.strictEqual(false, customerA.equals(customerB));

            return customerClass.findOne(1);
        }).then(function (b) {
            customerB = b;

            test.ok(customerA.equals(customerB));

            return Promise.all([
                customerClass.findOne(1),
                itemClass.findOne(1)
            ]);
        }).then(function (args) {
            customerA = args[0];
            customerB = args[1];

            test.strictEqual(false, customerA.equals(customerB));

            test.done();
        });
    }

    testFindCount(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        customerClass.find().count().then(function (count) {
            test.strictEqual(3, count);

            return customerClass.find().where({
                id: 1
            }).count();
        }).then(function (count) {
            test.strictEqual(1, count);

            return customerClass.find().where({
                id: [
                    1,
                    2
                ]
            }).count();
        }).then(function (count) {
            test.strictEqual(2, count);

            return customerClass.find().where({
                id: [
                    1,
                    2
                ]
            }).offset(1).count();
        }).then(function (count) {
            test.strictEqual(2, count);

            return customerClass.find().where({
                id: [
                    1,
                    2
                ]
            }).offset(2).count();
        }).then(function (count) {
            test.strictEqual(2, count);

            // limit should have no effect on count()
            return customerClass.find().limit(1).count();
        }).then(function (count) {
            test.strictEqual(3, count);

            return customerClass.find().limit(2).count();
        }).then(function (count) {
            test.strictEqual(3, count);

            return customerClass.find().limit(10).count();
        }).then(function (count) {
            test.strictEqual(3, count);

            return customerClass.find().offset(2).limit(2).count();
        }).then(function (count) {
            test.strictEqual(3, count);

            test.done();
        });
    }

    testFindLimit(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        // all()
        customerClass.find().all().then(function (customers) {
            test.strictEqual(3, customers.length);

            return customerClass.find().orderBy('id').limit(1).all();
        }).then(function (customers) {
            test.strictEqual(1, customers.length);
            test.strictEqual('user1', customers[0].get('name'));

            return customerClass.find().orderBy('id').limit(1).offset(1).all();
        }).then(function (customers) {
            test.strictEqual(1, customers.length);
            test.strictEqual('user2', customers[0].get('name'));

            return customerClass.find().orderBy('id').limit(1).offset(2).all();
        }).then(function (customers) {
            test.strictEqual(1, customers.length);
            test.strictEqual('user3', customers[0].get('name'));

            return customerClass.find().orderBy('id').limit(2).offset(1).all();
        }).then(function (customers) {
            test.strictEqual(2, customers.length);
            test.strictEqual('user2', customers[0].get('name'));
            test.strictEqual('user3', customers[1].get('name'));

            return customerClass.find().orderBy('id').limit(2).offset(3).all();
        }).then(function (customers) {
            test.strictEqual(0, customers.length);

            // one()
            return customerClass.find().orderBy('id').one();
        }).then(function (customer) {
            test.strictEqual('user1', customer.get('name'));

            return customerClass.find().orderBy('id').offset(0).one();
        }).then(function (customer) {
            test.strictEqual('user1', customer.get('name'));

            return customerClass.find().orderBy('id').offset(1).one();
        }).then(function (customer) {
            test.strictEqual('user2', customer.get('name'));

            return customerClass.find().orderBy('id').offset(2).one();
        }).then(function (customer) {
            test.strictEqual('user3', customer.get('name'));

            return customerClass.find().offset(3).one();
        }).then(function (customer) {
            test.strictEqual(null, customer);

            test.done();
        });
    }

    testFindComplexCondition(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        customerClass.find().where([
            'OR',
            {
                name: 'user1'
            },
            {
                name: 'user2'
            }
        ]).count().then(function (count) {
            test.strictEqual(2, count);

            return customerClass.find().where([
                'OR',
                {
                    name: 'user1'
                },
                {
                    name: 'user2'
                }
            ]).all();
        }).then(function (customers) {
            test.strictEqual(2, customers.length);

            return customerClass.find().where({
                name: [
                    'user1',
                    'user2'
                ]
            }).count();
        }).then(function (count) {
            test.strictEqual(2, count);

            return customerClass.find().where({
                name: [
                    'user1',
                    'user2'
                ]
            }).all();
        }).then(function (customers) {
            test.strictEqual(2, customers.length);

            return customerClass.find().where([
                'AND',
                {
                    name: [
                        'user2',
                        'user3'
                    ]
                },
                [
                    'BETWEEN',
                    'status',
                    2,
                    4
                ]
            ]).count();
        }).then(function (count) {
            test.strictEqual(1, count);

            return customerClass.find().where([
                'AND',
                {
                    name: [
                        'user2',
                        'user3'
                    ]
                },
                [
                    'BETWEEN',
                    'status',
                    2,
                    4
                ]
            ]).all();
        }).then(function (customers) {
            test.strictEqual(1, customers.length);

            test.done();
        });
    }

    testFindNullValues(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        customerClass.findOne(2).then(function (customer) {
            customer.set('name', null);
            return customer.save(false);
        }).then(function () {
            this.afterSave();

            return customerClass.find().where({
                name: null
            }).all();
        }.bind(this)).then(function (result) {
            test.strictEqual(1, result.length);
            test.equal(2, result[0].getPrimaryKey());

            test.done();
        }.bind(this));
    }

    testExists(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        customerClass.find().where({
            id: 2
        }).exists().then(function (isExists) {
            test.ok(isExists);

            return customerClass.find().where({
                id: 5
            }).exists();
        }).then(function (isExists) {
            test.ok(!isExists);

            return customerClass.find().where({
                name: 'user1'
            }).exists();
        }).then(function (isExists) {
            test.ok(isExists);

            return customerClass.find().where({
                name: 'user5'
            }).exists();
        }).then(function (isExists) {
            test.ok(!isExists);

            return customerClass.find().where({
                id: [
                    2,
                    3
                ]
            }).exists();
        }).then(function (isExists) {
            test.ok(isExists);

            return customerClass.find().where({
                id: [
                    2,
                    3
                ]
            }).offset(1).exists();
        }).then(function (isExists) {
            test.ok(isExists);

            return customerClass.find().where({
                id: [
                    2,
                    3
                ]
            }).offset(2).exists();
        }).then(function (isExists) {
            test.ok(!isExists);

            test.done();
        });
    }

    testFindLazy(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        /** @typedef {Customer} customer */
        var customer = null;

        customerClass.findOne(2).then(function (c) {
            customer = c;

            test.ok(!customer.isRelationPopulated('orders'));

            return customer.load('orders');
        }).then(function (orders) {
            test.ok(customer.isRelationPopulated('orders'));
            test.strictEqual(2, orders.length);
            test.strictEqual(1, _keys(customer.getRelatedRecords()).length);

            delete customer._related.orders;
            test.ok(!customer.isRelationPopulated('orders'));

            return customerClass.findOne(2);
        }).then(function (c) {
            customer = c;

            test.ok(!customer.isRelationPopulated('orders'));

            return customer.getOrders().where({
                id: 3
            }).all();
        }).then(function (orders) {
            test.ok(!customer.isRelationPopulated('orders'));

            test.strictEqual(0, _keys(customer.getRelatedRecords()).length);

            test.strictEqual(1, orders.length);
            test.equal(3, orders[0].get('id'));

            test.done();
        });
    }

    testFindEager(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        /** @typedef {Jii.data.ActiveRecord} orderClass */
        var orderClass = this.getOrderClass();

        var customer = null;
        var customers = null;

        customerClass.find().with('orders').indexBy('id').all().then(function (cs) {
            customers = cs;
            //ksort(customers);

            test.strictEqual(3, _keys(customers).length);
            test.ok(customers[1].isRelationPopulated('orders'));
            test.ok(customers[2].isRelationPopulated('orders'));
            test.ok(customers[3].isRelationPopulated('orders'));

            return customers[1].load('orders');
        }).then(function (orders) {
            test.strictEqual(1, orders.length);

            return customers[2].load('orders');
        }).then(function (orders) {
            test.strictEqual(2, orders.length);

            return customers[3].load('orders');
        }).then(function (orders) {
            test.strictEqual(0, orders.length);

            // unset
            delete customers[1]._related.orders;
            // @todo unset()
            test.ok(!customers[1].isRelationPopulated('orders'));

            return customerClass.find().where({
                id: 1
            }).with('orders').one();
        }).then(function (c) {
            customer = c;

            test.ok(customer.isRelationPopulated('orders'));

            return customer.load('orders');
        }).then(function (orders) {
            test.strictEqual(1, orders.length);
            test.strictEqual(1, _keys(customer.getRelatedRecords()).length);

            // multiple with() calls
            return orderClass.find().with('customer', 'items').all();
        }).then(function (orders) {
            test.strictEqual(3, orders.length);
            test.ok(orders[0].isRelationPopulated('customer'));
            test.ok(orders[0].isRelationPopulated('items'));

            return orderClass.find().with('customer').with('items').all();
        }).then(function (orders) {
            test.strictEqual(3, orders.length);
            test.ok(orders[0].isRelationPopulated('customer'));
            test.ok(orders[0].isRelationPopulated('items'));

            test.done();
        });
    }

    testFindLazyVia(test) {
        /** @typedef {Jii.data.ActiveRecord} orderClass */
        var orderClass = this.getOrderClass();

        var order = null;

        /** @typedef {Order} order */
        orderClass.findOne(1).then(function (o) {
            order = o;

            test.strictEqual(1, order.get('id'));

            return order.load('items');
        }).then(function (items) {
            test.strictEqual(2, items.length);
            test.strictEqual(1, order.get('items')[0].get('id'));
            test.strictEqual(2, order.get('items')[1].get('id'));

            test.done();
        });
    }

    testFindLazyVia2(test) {
        /** @typedef {Jii.data.ActiveRecord} orderClass */
        var orderClass = this.getOrderClass();

        /** @typedef {Order} order */
        orderClass.findOne(1).then(function (order) {
            order.set('id', 100);

            return order.load('items');
        }).then(function (items) {

            test.strictEqual(items.length, 0);

            test.done();
        });
    }

    testFindEagerViaRelation(test) {
        /** @typedef {Jii.data.ActiveRecord} orderClass */
        var orderClass = this.getOrderClass();

        var order = null;

        orderClass.find().with('items').orderBy('id').all().then(function (orders) {
            test.strictEqual(3, orders.length);

            order = orders[0];
            test.strictEqual(1, order.get('id'));
            test.ok(order.isRelationPopulated('items'));

            return order.load('items');
        }).then(function (items) {
            test.strictEqual(2, items.length);
            test.strictEqual(1, order.get('items')[0].get('id'));
            test.strictEqual(2, order.get('items')[1].get('id'));

            test.done();
        });
    }

    testFindNestedRelation(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        customerClass.find().with('orders', 'orders.items').indexBy('id').all().then(function (customers) {
            //ksort(customers);

            test.strictEqual(3, _keys(customers).length);
            test.ok(customers[1].isRelationPopulated('orders'));
            test.ok(customers[2].isRelationPopulated('orders'));
            test.ok(customers[3].isRelationPopulated('orders'));
            test.strictEqual(1, customers[1].get('orders').length);
            test.strictEqual(2, customers[2].get('orders').length);
            test.strictEqual(0, customers[3].get('orders').length);
            test.ok(customers[1].get('orders')[0].isRelationPopulated('items'));
            test.ok(customers[2].get('orders')[0].isRelationPopulated('items'));
            test.ok(customers[2].get('orders')[1].isRelationPopulated('items'));
            test.strictEqual(2, customers[1].get('orders')[0].get('items').length);
            test.strictEqual(3, customers[2].get('orders')[0].get('items').length);
            test.strictEqual(1, customers[2].get('orders')[1].get('items').length);

            test.done();
        });
    }

    /**
     * Ensure ActiveRelationTrait does preserve order of items on find via()
     * https://github.com/yiisoft/yii2/issues/1310
     */
    testFindEagerViaRelationPreserveOrder(test) {
        /** @typedef {Jii.data.ActiveRecord} orderClass */
        var orderClass = this.getOrderClass();

        /*
         Item (name, category_id)
         Order (customer_id, created_at, total)
         OrderItem (order_id, item_id, quantity, subtotal)

         Result should be the following:

         Order 1: 1, 1325282384, 110.0
         - orderItems:
         OrderItem: 1, 1, 1, 30.0
         OrderItem: 1, 2, 2, 40.0
         - itemsInOrder:
         Item 1: 'Agile Web Application Development with Jii1.1 and PHP5', 1
         Item 2: 'Jii 1.1 Application Development Cookbook', 1

         Order 2: 2, 1325334482, 33.0
         - orderItems:
         OrderItem: 2, 3, 1, 8.0
         OrderItem: 2, 4, 1, 10.0
         OrderItem: 2, 5, 1, 15.0
         - itemsInOrder:
         Item 5: 'Cars', 2
         Item 3: 'Ice Age', 2
         Item 4: 'Toy Story', 2
         Order 3: 2, 1325502201, 40.0
         - orderItems:
         OrderItem: 3, 2, 1, 40.0
         - itemsInOrder:
         Item 3: 'Ice Age', 2
         */
        orderClass.find().with('itemsInOrder1').orderBy('created_at').all().then(function (orders) {
            test.strictEqual(3, orders.length);

            var order = null;

            order = orders[0];
            test.strictEqual(1, order.get('id'));
            test.ok(order.isRelationPopulated('itemsInOrder1'));
            test.strictEqual(2, order.get('itemsInOrder1').length);
            test.equal(1, order.get('itemsInOrder1')[0].get('id'));
            test.equal(2, order.get('itemsInOrder1')[1].get('id'));

            order = orders[1];
            test.strictEqual(2, order.get('id'));
            test.ok(order.isRelationPopulated('itemsInOrder1'));
            test.strictEqual(3, order.get('itemsInOrder1').length);
            test.equal(5, order.get('itemsInOrder1')[0].get('id'));
            test.equal(3, order.get('itemsInOrder1')[1].get('id'));
            test.equal(4, order.get('itemsInOrder1')[2].get('id'));

            order = orders[2];
            test.strictEqual(3, order.get('id'));
            test.ok(order.isRelationPopulated('itemsInOrder1'));
            test.strictEqual(1, order.get('itemsInOrder1').length);
            test.equal(2, order.get('itemsInOrder1')[0].get('id'));

            test.done();
        });
    }

    // different order in via table
    testFindEagerViaRelationPreserveOrderB(test) {
        /** @typedef {Jii.data.ActiveRecord} orderClass */
        var orderClass = this.getOrderClass();

        orderClass.find().with('itemsInOrder2').orderBy('created_at').all().then(function (orders) {
            test.strictEqual(3, orders.length);

            var order = null;

            order = orders[0];
            test.equal(1, order.get('id'));
            test.ok(order.isRelationPopulated('itemsInOrder2'));
            test.strictEqual(2, order.get('itemsInOrder2').length);
            test.equal(1, order.get('itemsInOrder2')[0].get('id'));
            test.equal(2, order.get('itemsInOrder2')[1].get('id'));

            order = orders[1];
            test.equal(2, order.get('id'));
            test.ok(order.isRelationPopulated('itemsInOrder2'));
            test.strictEqual(3, order.get('itemsInOrder2').length);
            test.equal(5, order.get('itemsInOrder2')[0].get('id'));
            test.equal(3, order.get('itemsInOrder2')[1].get('id'));
            test.equal(4, order.get('itemsInOrder2')[2].get('id'));

            order = orders[2];
            test.strictEqual(3, order.get('id'));
            test.ok(order.isRelationPopulated('itemsInOrder2'));
            test.strictEqual(1, order.get('itemsInOrder2').length);
            test.equal(2, order.get('itemsInOrder2')[0].get('id'));

            test.done();
        });
    }

    testLink(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        /** @typedef {Jii.data.ActiveRecord} orderClass */
        var orderClass = this.getOrderClass();

        /** @typedef {Jii.data.ActiveRecord} orderItemClass */
        var orderItemClass = this.getOrderItemClass();

        /** @typedef {Jii.data.ActiveRecord} itemClass */
        var itemClass = this.getItemClass();

        var order = null;
        var customer = null;

        customerClass.findOne(2).then(function (c) {
            customer = c;
            return customer.load('orders');
        }).then(function (orders) {
            test.strictEqual(2, orders.length);

            // has many
            order = new orderClass();
            order.set('total', 100);
            test.ok(order.isNewRecord());
            return customer.link('orders', order);
        }).then(function () {
            this.afterSave();

            return customer.load('orders');
        }.bind(this)).then(function (orders) {
            test.strictEqual(3, orders.length);
            test.ok(!order.isNewRecord());

            return customer.getOrders().all();
        }).then(function (orders) {
            test.strictEqual(3, orders.length);
            test.strictEqual(2, order.get('customer_id'));

            // belongs to
            order = new orderClass();
            order.set('total', 100);
            test.ok(order.isNewRecord());

            return customerClass.findOne(1);
        }).then(function (c) {
            customer = c;

            return order.load('customer');
        }).then(function (cr) {

            test.strictEqual(null, cr);

            return order.link('customer', customer);
        }).then(function () {
            test.ok(!order.isNewRecord());

            test.equal(1, order.get('customer_id'));
            test.equal(1, order.get('customer').getPrimaryKey());

            // via model
            return orderClass.findOne(1);
        }).then(function (o) {
            order = o;

            return order.load('items');
        }).then(function (items) {
            test.strictEqual(2, items.length);

            return order.load('orderItems');
        }).then(function (orderItems) {
            test.strictEqual(2, orderItems.length);

            return orderItemClass.findOne({
                order_id: 1,
                item_id: 3
            });
        }).then(function (orderItem) {
            test.strictEqual(null, orderItem);

            return itemClass.findOne(3);
        }).then(function (item) {
            return order.link('items', item, {
                quantity: 10,
                subtotal: 100
            });
        }).then(function () {
            this.afterSave();

            return order.load('items');
        }.bind(this)).then(function (items) {
            test.strictEqual(3, items.length);

            return order.load('orderItems');
        }).then(function (orderItems) {
            test.strictEqual(3, orderItems.length);

            return orderItemClass.findOne({
                order_id: 1,
                item_id: 3
            });
        }.bind(this)).then(function (orderItem) {
            test.ok(orderItem instanceof orderItemClass);

            test.equal(10, orderItem.get('quantity'));
            test.equal(100, orderItem.get('subtotal'));

            test.done();
        }.bind(this));
    }

    testUnlink(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        /** @typedef {Jii.data.ActiveRecord} orderClass */
        var orderClass = this.getOrderClass();

        /** @typedef {Jii.data.ActiveRecord} orderWithNullFKClass */
        var orderWithNullFKClass = this.getOrderWithNullFKClass();

        var order = null;
        var customer = null;

        // has many without delete
        customerClass.findOne(2).then(function (c) {
            customer = c;

            return customer.load('ordersWithNullFK');
        }).then(function (ordersWithNullFK) {
            test.strictEqual(2, ordersWithNullFK.length);

            return customer.unlink('ordersWithNullFK', ordersWithNullFK[1], false);
        }).then(function () {

            return customer.load('ordersWithNullFK');
        }).then(function (ordersWithNullFK) {
            test.strictEqual(1, ordersWithNullFK.length);

            return orderWithNullFKClass.findOne(3);
        }).then(function (orderWithNullFK) {
            test.equal(3, orderWithNullFK.get('id'));
            test.strictEqual(null, orderWithNullFK.get('customer_id'));

            return customerClass.findOne(2);
        }).then(function (customer) {

            // has many with delete
            return customer.load('orders');
        }).then(function (orders) {
            test.strictEqual(2, orders.length);

            return customer.unlink('orders', orders[1], true);
        }).then(function () {
            this.afterSave();

            return customer.load('orders');
        }.bind(this)).then(function (orders) {
            test.strictEqual(1, orders.length);

            return orderClass.findOne(3);
        }).then(function (o) {
            order = o;
            test.strictEqual(null, order);

            // via model with delete
            return orderClass.findOne(2);
        }).then(function (o) {
            order = o;

            return order.load('orderItems');
        }).then(function (orderItems) {
            test.strictEqual(3, orderItems.length);

            return order.load('items');
        }).then(function (items) {
            test.strictEqual(3, items.length);

            return order.unlink('items', items[2], true);
        }).then(function () {
            this.afterSave();

            // via model without delete
            return order.load('itemsWithNullFK');
        }.bind(this)).then(function (itemsWithNullFK) {
            test.strictEqual(3, itemsWithNullFK.length);

            return order.unlink('itemsWithNullFK', itemsWithNullFK[2], false);
        }).then(function () {
            this.afterSave();

            return order.load('itemsWithNullFK');
        }.bind(this)).then(function (itemsWithNullFK) {
            test.strictEqual(2, itemsWithNullFK.length);

            return order.load('orderItems');
        }).then(function (orderItems) {
            test.strictEqual(2, orderItems.length);

            test.done();
        });
    }

    testUnlinkAll(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        /** @typedef {Jii.data.ActiveRecord} orderClass */
        var orderClass = this.getOrderClass();

        /** @typedef {Jii.data.ActiveRecord} orderItemClass */
        var orderItemClass = this.getOrderItemClass();

        /** @typedef {Jii.data.ActiveRecord} itemClass */
        var itemClass = this.getItemClass();

        /** @typedef {Jii.data.ActiveRecord} orderWithNullFKClass */
        var orderWithNullFKClass = this.getOrderWithNullFKClass();

        /** @typedef {Jii.data.ActiveRecord} orderItemsWithNullFKClass */
        var orderItemsWithNullFKClass = this.getOrderItemWithNullFKmClass();

        var customer = null;
        var order = null;
        var orderItemCount = null;

        // has many with delete
        customerClass.findOne(2).then(function (c) {
            customer = c;

            return customer.load('orders');
        }).then(function (orders) {
            test.strictEqual(2, orders.length);

            return orderClass.find().count();
        }).then(function (ordersCount) {
            test.strictEqual(3, ordersCount);

            return customer.unlinkAll('orders', true);
        }).then(function () {
            this.afterSave();

            return orderClass.find().count();
        }.bind(this)).then(function (ordersCount) {
            test.strictEqual(1, ordersCount);

            return customer.load('orders');
        }).then(function (orders) {
            test.strictEqual(0, orders.length);

            return orderClass.findOne(2);
        }).then(function (o) {
            order = o;
            test.strictEqual(null, order);

            return orderClass.findOne(3);
        }).then(function (o) {
            order = o;
            test.strictEqual(null, order);

            // has many without delete
            return customerClass.findOne(2);
        }).then(function (c) {
            customer = c;

            return customer.load('ordersWithNullFK');
        }).then(function (ordersWithNullFK) {
            test.strictEqual(2, ordersWithNullFK.length);

            return orderWithNullFKClass.find().count();
        }).then(function (orderWithNullFKCount) {
            test.strictEqual(3, orderWithNullFKCount);

            return customer.unlinkAll('ordersWithNullFK', false);
        }).then(function () {
            this.afterSave();

            return customer.load('ordersWithNullFK');
        }.bind(this)).then(function (ordersWithNullFK) {
            test.strictEqual(0, ordersWithNullFK.length);

            return orderWithNullFKClass.find().count();
        }).then(function (orderWithNullFKCount) {
            test.strictEqual(3, orderWithNullFKCount);

            return orderWithNullFKClass.find().where([
                'AND',
                {
                    id: [
                        2,
                        3
                    ],
                    customer_id: null
                }
            ]).count();
        }).then(function (orderWithNullFKCount) {
            test.strictEqual(2, orderWithNullFKCount);

            // via model with delete
            /** @typedef {Order} order */
            return orderClass.findOne(1);
        }).then(function (o) {
            order = o;

            return order.load('books');
        }).then(function (books) {
            test.strictEqual(2, books.length);

            return orderItemClass.find().count();
        }).then(function (oic) {
            orderItemCount = oic;

            return itemClass.find().count();
        }).then(function (itemsCount) {
            test.strictEqual(5, itemsCount);

            return order.unlinkAll('books', true);
        }).then(function () {
            this.afterSave();

            return itemClass.find().count();
        }.bind(this)).then(function (itemsCount) {
            test.strictEqual(5, itemsCount);

            return orderItemClass.find().count();
        }).then(function (count) {
            test.strictEqual(orderItemCount - 2, count);

            return order.load('books');
        }).then(function (books) {
            test.strictEqual(0, books.length);

            // via model without delete
            return order.load('booksWithNullFK');
        }).then(function (booksWithNullFK) {
            test.strictEqual(2, booksWithNullFK.length);

            return orderItemsWithNullFKClass.find().count();
        }.bind(this)).then(function (oic) {
            orderItemCount = oic;

            return itemClass.find().count();
        }.bind(this)).then(function (itemsCount) {
            test.strictEqual(5, itemsCount);

            return order.unlinkAll('booksWithNullFK', false);
        }).then(function () {
            this.afterSave();

            return order.load('booksWithNullFK');
        }.bind(this)).then(function (booksWithNullFK) {
            test.strictEqual(0, booksWithNullFK.length);

            return orderItemsWithNullFKClass.find().where([
                'AND',
                {
                    item_id: [
                        1,
                        2
                    ]
                },
                {
                    order_id: null
                }
            ]).count();
        }).then(function (orderItemsWithNullFKCount) {
            test.strictEqual(2, orderItemsWithNullFKCount);

            return orderItemsWithNullFKClass.find().count();
        }).then(function (orderItemsWithNullFKCount) {
            test.strictEqual(orderItemCount, orderItemsWithNullFKCount);

            return itemClass.find().count();
        }).then(function (itemsCount) {
            test.strictEqual(5, itemsCount);

            test.done();
        });
        // via table is covered in ActiveRecordTest.testUnlinkAllViaTable()
    }

    testUnlinkAllAndConditionSetNull(test) {
        /** @typedef {ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        /** @typedef {ActiveRecord} orderClass */
        var orderClass = this.getOrderWithNullFKClass();

        var customer = null;

        // in this test all orders are owned by customer 1
        orderClass.updateAll({
            customer_id: 1
        }).then(function () {
            this.afterSave();

            return customerClass.findOne(1);
        }.bind(this)).then(function (c) {
            customer = c;

            return Promise.all([
                customer.load('ordersWithNullFK'),
                customer.load('expensiveOrdersWithNullFK')
            ]);
        }).then(function (args) {
            test.strictEqual(3, args[0].length);
            test.strictEqual(1, args[1].length);

            return orderClass.find().count();
        }).then(function (ordersCount) {
            test.strictEqual(3, ordersCount);

            return customer.unlinkAll('expensiveOrdersWithNullFK');
        }).then(function () {

            return Promise.all([
                customer.load('ordersWithNullFK'),
                customer.load('expensiveOrdersWithNullFK')
            ]);
        }).then(function (args) {
            test.strictEqual(3, args[0].length);
            test.strictEqual(0, args[1].length);

            return orderClass.find().count();
        }).then(function (ordersCount) {
            test.strictEqual(3, ordersCount);

            return customerClass.findOne(1);
        }).then(function (c) {
            customer = c;

            return Promise.all([
                customer.load('ordersWithNullFK'),
                customer.load('expensiveOrdersWithNullFK')
            ]);
        }).then(function (args) {
            test.strictEqual(2, args[0].length);
            test.strictEqual(0, args[1].length);

            test.done();
        });
    }

    testUnlinkAllAndConditionDelete(test) {

        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        /** @typedef {Jii.data.ActiveRecord} orderClass */
        var orderClass = this.getOrderClass();

        var customer = null;

        // in this test all orders are owned by customer 1
        orderClass.updateAll({
            customer_id: 1
        }).then(function () {
            this.afterSave();

            return customerClass.findOne(1);
        }.bind(this)).then(function (c) {
            customer = c;

            return Promise.all([
                customer.load('orders'),
                customer.load('expensiveOrders')
            ]);
        }).then(function (args) {
            test.strictEqual(3, args[0].length);
            test.strictEqual(1, args[1].length);

            return orderClass.find().count();
        }).then(function (ordersCount) {
            test.strictEqual(3, ordersCount);

            return customer.unlinkAll('expensiveOrders', true);
        }).then(function () {

            return Promise.all([
                customer.load('orders'),
                customer.load('expensiveOrders')
            ]);
        }).then(function (args) {
            test.strictEqual(3, args[0].length);
            test.strictEqual(0, args[1].length);

            return orderClass.find().count();
        }).then(function (ordersCount) {
            test.strictEqual(2, ordersCount);

            return customerClass.findOne(1);
        }.bind(this)).then(function (c) {
            customer = c;

            return Promise.all([
                customer.load('orders'),
                customer.load('expensiveOrders')
            ]);
        }).then(function (args) {
            test.strictEqual(2, args[0].length);
            test.strictEqual(0, args[1].length);

            test.done();
        });
    }

    testInsert(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        var customer = new customerClass();
        customer.set('email', 'user4@example.com');
        customer.set('name', 'user4');
        customer.set('address', 'address4');

        test.strictEqual(null, customer.get('id'));
        test.ok(customer.isNewRecord());
        Jii.__afterSaveNewRecord = null;
        Jii.__afterSaveInsert = null;

        customer.save().then(() => {
            this.afterSave();

            test.notStrictEqual(null, customer.get('id'));
            test.ok(!Jii.__afterSaveNewRecord);
            test.ok(Jii.__afterSaveInsert);
            test.ok(!customer.isNewRecord());

            test.done();
        });
    }

    testUpdate(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        var customer = null;

        // save
        /** @typedef {Customer} customer */
        customerClass.findOne(2).then(function (c) {
            customer = c;

            test.ok(customer instanceof customerClass);
            test.strictEqual('user2', customer.get('name'));
            test.ok(!customer.isNewRecord());
            Jii.__afterSaveNewRecord = null;
            Jii.__afterSaveInsert = null;
            test.deepEqual({}, customer.getDirtyAttributes());

            customer.set('name', 'user2x');
            return customer.save();
        }.bind(this)).then(function () {

            this.afterSave();
            test.strictEqual('user2x', customer.get('name'));
            test.ok(!customer.isNewRecord());
            test.ok(!Jii.__afterSaveNewRecord);
            test.ok(!Jii.__afterSaveInsert);

            return customerClass.findOne(2);
        }.bind(this)).then(function (customer2) {
            test.strictEqual('user2x', customer2.get('name'));

            return customerClass.findOne(3);
        }).then(function (c) {
            customer = c;

            test.strictEqual('user3', customer.get('name'));

            // updateAll
            return customerClass.updateAll({
                name: 'temp'
            }, {
                id: 3
            });
        }).then(function (ret) {
            this.afterSave();

            test.strictEqual(1, ret.affectedRows);

            return customerClass.findOne(3);
        }.bind(this)).then(function (c) {
            customer = c;

            test.strictEqual('temp', customer.get('name'));

            return customerClass.updateAll({
                name: 'tempX'
            });
        }).then(function (ret) {
            this.afterSave();
            test.strictEqual(3, ret.affectedRows);

            return customerClass.updateAll({
                name: 'temp'
            }, {
                name: 'user6'
            });
        }.bind(this)).then(function (ret) {
            this.afterSave();
            test.strictEqual(0, ret.affectedRows);

            test.done();
        }.bind(this));
    }

    testUpdateAttributes(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        var customer = null;

        /** @typedef {Customer} customer */
        customerClass.findOne(2).then(function (c) {
            customer = c;

            test.ok(customer instanceof customerClass);
            test.strictEqual('user2', customer.get('name'));
            test.ok(!customer.isNewRecord());
            Jii.__afterSaveNewRecord = null;
            Jii.__afterSaveInsert = null;

            return customer.updateAttributes({
                name: 'user2x'
            });
        }.bind(this)).then(function () {
            this.afterSave();
            test.strictEqual('user2x', customer.get('name'));
            test.ok(!customer.isNewRecord());
            test.strictEqual(null, Jii.__afterSaveNewRecord);
            test.strictEqual(null, Jii.__afterSaveInsert);

            return customerClass.findOne(2);
        }.bind(this)).then(function (customer2) {
            test.strictEqual('user2x', customer2.get('name'));

            return customerClass.findOne(1);
        }).then(function (c) {
            customer = c;

            test.strictEqual('user1', customer.get('name'));
            test.strictEqual(1, customer.get('status'));
            customer.set('name', 'user1x');
            customer.set('status', 2);

            return customer.updateAttributes(['name']);
        }).then(function (c) {
            test.strictEqual('user1x', customer.get('name'));
            test.strictEqual(2, customer.get('status'));

            return customerClass.findOne(1);
        }).then(function (c) {
            customer = c;

            test.strictEqual('user1x', customer.get('name'));
            test.strictEqual(1, customer.get('status'));

            test.done();
        });
    }

    testUpdateCounters(test) {
        /** @typedef {Jii.data.ActiveRecord} orderItemClass */
        var orderItemClass = this.getOrderItemClass();

        var orderItem = null;

        // updateCounters
        var pk = {
            order_id: 2,
            item_id: 4
        };
        orderItemClass.findOne(pk).then(function (oi) {
            orderItem = oi;

            test.equal(1, orderItem.get('quantity'));

            return orderItem.updateCounters({
                quantity: -1
            });
        }).then(function (ret) {
            this.afterSave();

            test.strictEqual(true, ret);
            test.equal(0, orderItem.get('quantity'));

            return orderItemClass.findOne(pk);
        }.bind(this)).then(function (orderItem) {
            test.equal(0, orderItem.get('quantity'));

            // updateAllCounters
            pk = {
                order_id: 1,
                item_id: 2
            };
            return orderItemClass.findOne(pk);
        }).then(function (orderItem) {
            test.equal(2, orderItem.get('quantity'));

            return orderItemClass.updateAllCounters({
                quantity: 3,
                subtotal: -10
            }, pk);
        }).then(function (ret) {
            this.afterSave();
            test.strictEqual(1, ret.affectedRows);

            return orderItemClass.findOne(pk);
        }.bind(this)).then(function (orderItem) {
            test.equal(5, orderItem.get('quantity'));
            test.equal(30, orderItem.get('subtotal'));

            test.done();
        });
    }

    testDelete(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        // delete
        customerClass.findOne(2).then(function (customer) {
            test.ok(customer instanceof customerClass);
            test.equal('user2', customer.get('name'));

            return customer.delete();
        }).then(function () {
            this.afterSave();

            return customerClass.findOne(2);
        }.bind(this)).then(function (customer) {
            test.strictEqual(null, customer);

            // deleteAll
            return customerClass.find().all();
        }).then(function (customers) {
            test.strictEqual(2, customers.length);

            return customerClass.deleteAll();
        }).then(function (ret) {
            this.afterSave();
            test.strictEqual(2, ret.affectedRows);

            return customerClass.find().all();
        }.bind(this)).then(function (customers) {
            test.strictEqual(0, customers.length);

            return customerClass.deleteAll();
        }).then(function (ret) {
            this.afterSave();
            test.strictEqual(0, ret.affectedRows);

            test.done();
        }.bind(this));
    }

    /**
     * Some PDO implementations(e.g. cubrid) do not support boolean values.
     * Make sure this does not affect AR layer.
     */
    testBooleanAttribute(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        var customer = new customerClass();
        customer.set('name', 'boolean customer');
        customer.set('email', 'mail@example.com');
        customer.set('status', true);

        customer.save(false).then(function () {

            return customer.refresh();
        }).then(function () {
            test.strictEqual(1, customer.get('status'));

            customer.set('status', false);
            return customer.save(false);
        }).then(function () {

            return customer.refresh();
        }).then(function () {
            test.strictEqual(0, customer.get('status'));

            return customerClass.find().where({
                status: true
            }).all();
        }).then(function (customers) {
            test.strictEqual(2, customers.length);

            return customerClass.find().where({
                status: false
            }).all();
        }).then(function (customers) {
            test.strictEqual(1, customers.length);

            test.done();
        });
    }

    testAfterFind(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        /** @typedef {ActiveRecord} orderClass */
        var orderClass = this.getOrderClass();

        var afterFindCalls = [];
        Event.on(ActiveRecord, ActiveRecord.EVENT_AFTER_FIND, function (event) {
            /** @typedef {ActiveRecord} ar */
            var ar = event.sender;
            afterFindCalls.push([
                ar.className(),
                ar.isNewRecord(),
                ar.getPrimaryKey(),
                ar.isRelationPopulated('orders')
            ]);
        });

        customerClass.findOne(1).then(function (customer) {
            test.notStrictEqual(null, customer);

            test.deepEqual([[
                customerClass.className(),
                false,
                1,
                false
            ]], afterFindCalls);
            afterFindCalls = [];

            return customerClass.find().where({
                id: 1
            }).one();
        }).then(function (customer) {
            test.notStrictEqual(null, customer);
            test.deepEqual([[
                customerClass.className(),
                false,
                1,
                false
            ]], afterFindCalls);
            afterFindCalls = [];

            return customerClass.find().where({
                id: 1
            }).all();
        }).then(function (customer) {
            test.notStrictEqual(null, customer);
            test.deepEqual([[
                customerClass.className(),
                false,
                1,
                false
            ]], afterFindCalls);
            afterFindCalls = [];

            return customerClass.find().where({
                id: 1
            }).with('orders').all();
        }).then(function (customer) {
            test.notStrictEqual(null, customer);
            test.deepEqual([
                [
                    this.getOrderClass().className(),
                    false,
                    1,
                    false
                ],
                [
                    customerClass.className(),
                    false,
                    1,
                    true
                ]
            ], afterFindCalls);
            afterFindCalls = [];

            // orderBy is needed to avoid random test failure
            return customerClass.find().where({
                id: [
                    1,
                    2
                ]
            }).with('orders').orderBy('name').all();
        }.bind(this)).then(function (customer) {
            test.notStrictEqual(null, customer);
            test.deepEqual([
                [
                    orderClass.className(),
                    false,
                    1,
                    false
                ],
                [
                    orderClass.className(),
                    false,
                    2,
                    false
                ],
                [
                    orderClass.className(),
                    false,
                    3,
                    false
                ],
                [
                    customerClass.className(),
                    false,
                    1,
                    true
                ],
                [
                    customerClass.className(),
                    false,
                    2,
                    true
                ]
            ], afterFindCalls);
            afterFindCalls = [];

            Event.off(ActiveRecord, ActiveRecord.EVENT_AFTER_FIND);

            test.done();
        });
    }

    testFindEmptyInCondition(test) {
        /** @typedef {Jii.data.ActiveRecord} customerClass */
        var customerClass = this.getCustomerClass();

        customerClass.find().where({
            id: [1]
        }).all().then(function (customers) {
            test.strictEqual(1, customers.length);

            return customerClass.find().where({
                id: []
            }).all();
        }).then(function (customers) {
            test.strictEqual(0, customers.length);

            return customerClass.find().where([
                'IN',
                'id',
                [1]
            ]).all();
        }).then(function (customers) {
            test.strictEqual(1, customers.length);

            return customerClass.find().where([
                'IN',
                'id',
                []
            ]).all();
        }).then(function (customers) {
            test.strictEqual(0, customers.length);

            test.done();
        });
    }

    testFindEagerIndexBy(test) {
        /** @typedef {Jii.data.ActiveRecord} orderClass */
        var orderClass = this.getOrderClass();

        /** @typedef {Order} order */
        orderClass.find().with('itemsIndexed').where({
            id: 1
        }).one().then(function (order) {
            test.ok(order.isRelationPopulated('itemsIndexed'));

            return order.load('itemsIndexed');
        }).then(function (items) {
            test.strictEqual(2, _keys(items).length);
            test.ok(!!items[1]);
            test.ok(!!items[2]);

            return orderClass.find().with('itemsIndexed').where({
                id: 2
            }).one();
        }).then(function (order) {
            test.ok(order.isRelationPopulated('itemsIndexed'));

            return order.load('itemsIndexed');
        }).then(function (items) {
            test.strictEqual(3, _keys(items).length);
            test.ok(!!items[3]);
            test.ok(!!items[4]);
            test.ok(!!items[5]);

            test.done();
        });
    }

    testCustomColumns(test) {
        // find custom column
        Customer.find().select([
            '*',
            '(status*2) AS status2'
        ]).where({
            name: 'user3'
        }).one().then(function (customer) {
            test.equal(3, customer.get('id'));
            test.equal(4, customer.get('status2'));

            test.done();
        });
    }

    testStatisticalFind(test) {
        // find count, sum, average, min, max, scalar
        Customer.find().count().then(function (count) {
            test.strictEqual(3, count);

            return Customer.find().where('id=1 OR id=2').count();
        }).then(function (count) {
            test.strictEqual(2, count);

            return Customer.find().sum('id');
        }).then(function (count) {
            test.strictEqual(6, count);

            return Customer.find().average('id');
        }).then(function (count) {
            test.strictEqual(2, count);

            return Customer.find().min('id');
        }).then(function (count) {
            test.strictEqual(1, count);

            return Customer.find().max('id');
        }).then(function (count) {
            test.strictEqual(3, count);

            return Customer.find().select('count(*)').scalar();
        }).then(function (count) {
            test.equal(3, count);

            test.done();
        });
    }

    testFindBySql(test) {
        // find one
        Customer.findBySql('SELECT * FROM customer ORDER BY id DESC').one().then(function (customer) {
            test.ok(customer instanceof Customer);
            test.strictEqual('user3', customer.get('name'));

            // find all
            return Customer.findBySql('SELECT * FROM customer').all();
        }).then(function (customers) {
            test.strictEqual(3, customers.length);

            // find with parameter binding
            return Customer.findBySql('SELECT * FROM customer WHERE id=:id', {
                ':id': 2
            }).one();
        }).then(function (customer) {
            test.ok(customer instanceof Customer);
            test.strictEqual('user2', customer.get('name'));

            test.done();
        });
    }

    testFindLazyViaTable(test) {
        /** @typedef {Order} order */
        var order = null;

        Order.findOne(1).then(function (o) {
            order = o;
            test.equal(1, order.get('id'));

            return order.load('books');
        }).then(function (books) {
            test.strictEqual(2, books.length);

            return order.load('items');
        }).then(function (items) {

            test.equal(1, items[0].get('id'));
            test.equal(2, items[1].get('id'));

            return Order.findOne(2);
        }).then(function (o) {
            order = o;

            test.equal(2, order.get('id'));

            return order.load('books');
        }).then(function (books) {
            test.strictEqual(0, books.length);

            return Order.find().where({
                id: 1
            }).asArray().one();
        }).then(function (order) {
            test.ok(_isObject(order));

            test.done();
        });
    }

    testFindEagerViaTable(test) {
        /** @typedef {Order[]} order */
        var orders = null;

        Order.find().with('books').orderBy('id').all().then(function (os) {
            orders = os;

            test.strictEqual(3, orders.length);

            var order = orders[0];
            test.equal(1, order.get('id'));

            return order.load('books');
        }).then(function (books) {
            test.strictEqual(2, books.length);
            test.equal(1, books[0].get('id'));
            test.equal(2, books[1].get('id'));

            var order = orders[1];
            test.strictEqual(2, order.get('id'));

            return order.load('books');
        }).then(function (books) {
            test.strictEqual(0, books.length);

            var order = orders[2];
            test.strictEqual(3, order.get('id'));

            return order.load('books');
        }).then(function (books) {
            test.strictEqual(1, books.length);
            test.equal(2, books[0].get('id'));

            // https://github.com/yiisoft/yii2/issues/1402
            return Order.find().with('books').orderBy('id').asArray().all();
        }).then(function (orders) {
            test.strictEqual(3, orders.length);
            test.ok(_isObject(orders[0]['orderItems'][0]));

            var order = orders[0];
            test.ok(_isObject(order));
            test.equal(1, order['id']);
            test.strictEqual(2, order['books'].length);
            test.equal(1, order['books'][0]['id']);
            test.equal(2, order['books'][1]['id']);

            test.done();
        });
    }

    // deeply nested table relation
    testDeeplyNestedTableRelation(test) {
        /** @typedef {Customer} customer */
        Customer.findOne(1).then(function (customer) {
            test.notStrictEqual(customer);

            return customer.load('orderItems');
        }).then(function (items) {
            test.strictEqual(2, items.length);

            test.strictEqual(Item.className(), items[0].className());
            test.strictEqual(Item.className(), items[1].className());
            test.equal(1, items[0].get('id'));
            test.equal(2, items[1].get('id'));

            test.done();
        });
    }

    /**
     * https://github.com/yiisoft/yii2/issues/5341
     *
     * Issue:     Plan     1 -- * Account * -- * User
     * Our Tests: Category 1 -- * Item    * -- * Order
     */
    testDeeplyNestedTableRelation2(test) {
        /** @typedef {Category} category */
        Category.findOne(1).then(function (category) {
            test.notStrictEqual(category);

            return category.load('orders');
        }).then(function (orders) {
            test.strictEqual(2, orders.length);
            test.strictEqual(Order.className(), orders[0].className());
            test.strictEqual(Order.className(), orders[1].className());

            var ids = [
                orders[0].get('id'),
                orders[1].get('id')
            ].sort();
            test.deepEqual([
                1,
                3
            ], ids);

            return Category.findOne(2);
        }).then(function (category) {
            test.notStrictEqual(category);

            return category.load('orders');
        }).then(function (orders) {
            test.strictEqual(1, orders.length);

            test.strictEqual(Order.className(), orders[0].className());
            test.equal(2, orders[0].get('id'));

            test.done();
        });
    }

    testStoreNull(test) {
        var record = new NullValues();
        test.strictEqual(null, record.get('var1'));
        test.strictEqual(null, record.get('var2'));
        test.strictEqual(null, record.get('var3'));
        test.strictEqual(null, record.get('stringcol'));

        record.set('id', 1);

        record.set('var1', 123);
        record.set('var2', 456);
        record.set('var3', 789);
        record.set('stringcol', 'hello!');

        record.save(false).then(function () {

            return record.refresh();
        }).then(function (ret) {
            test.ok(ret);

            test.equal(123, record.get('var1'));
            test.equal(456, record.get('var2'));
            test.equal(789, record.get('var3'));
            test.strictEqual('hello!', record.get('stringcol'));

            record.set('var1', null);
            record.set('var2', null);
            record.set('var3', null);
            record.set('stringcol', null);

            return record.save(false);
        }).then(function () {

            return record.refresh();
        }).then(function (ret) {
            test.ok(ret);

            test.strictEqual(null, record.get('var1'));
            test.strictEqual(null, record.get('var2'));
            test.strictEqual(null, record.get('var3'));
            test.strictEqual(null, record.get('stringcol'));

            record.set('var1', 0);
            record.set('var2', 0);
            record.set('var3', 0);
            record.set('stringcol', '');

            return record.save(false);
        }).then(function () {

            return record.refresh();
        }).then(function (ret) {
            test.ok(ret);

            test.equal(0, record.get('var1'));
            test.equal(0, record.get('var2'));
            test.equal(0, record.get('var3'));
            test.strictEqual('', record.get('stringcol'));

            test.done();
        });
    }

    testStoreEmpty(test) {
        var record = new NullValues();
        record.set('id', 1);

        // this is to simulate empty html form submission
        record.set('var1', '');
        record.set('var2', '');
        record.set('var3', '');
        record.set('stringcol', '');

        record.save(false).then(function () {

            return record.refresh();
        }).then(function (ret) {
            test.ok(ret);

            // https://github.com/yiisoft/yii2/commit/34945b0b69011bc7cab684c7f7095d837892a0d4#commitcomment-4458225
            test.ok(record.get('var1') === record.get('var2'));
            test.ok(record.get('var2') === record.get('var3'));

            test.done();
        });
    }

    testIsPrimaryKey(test) {
        test.ok(!Customer.isPrimaryKey([]));
        test.ok(Customer.isPrimaryKey(['id']));
        test.ok(!Customer.isPrimaryKey([
            'id',
            'name'
        ]));
        test.ok(!Customer.isPrimaryKey(['name']));
        test.ok(!Customer.isPrimaryKey([
            'name',
            'email'
        ]));

        test.ok(!OrderItem.isPrimaryKey([]));
        test.ok(!OrderItem.isPrimaryKey(['order_id']));
        test.ok(!OrderItem.isPrimaryKey(['item_id']));
        test.ok(!OrderItem.isPrimaryKey(['quantity']));
        test.ok(!OrderItem.isPrimaryKey([
            'quantity',
            'subtotal'
        ]));
        test.ok(OrderItem.isPrimaryKey([
            'order_id',
            'item_id'
        ]));
        test.ok(!OrderItem.isPrimaryKey([
            'order_id',
            'item_id',
            'quantity'
        ]));

        test.done();
    }

    testJoinWith(test) {
        var query = null;

        // left join and eager loading
        Order.find().joinWith('customer').orderBy('customer.id DESC, order.id').all().then(function (orders) {
            test.strictEqual(3, orders.length);
            test.equal(2, orders[0].get('id'));
            test.equal(3, orders[1].get('id'));
            test.equal(1, orders[2].get('id'));
            test.ok(orders[0].isRelationPopulated('customer'));
            test.ok(orders[1].isRelationPopulated('customer'));
            test.ok(orders[2].isRelationPopulated('customer'));

            // inner join filtering and eager loading
            return Order.find().innerJoinWith({
                customer(query) {
                    query.where('customer.id=2');
                }
            }).orderBy('order.id').all();
        }).then(function (orders) {
            test.strictEqual(2, orders.length);
            test.equal(2, orders[0].get('id'));
            test.equal(3, orders[1].get('id'));
            test.ok(orders[0].isRelationPopulated('customer'));
            test.ok(orders[1].isRelationPopulated('customer'));

            // inner join filtering, eager loading, conditions on both primary and relation
            return Order.find().innerJoinWith({
                customer(query) {
                    query.where({
                        'customer.id': 2
                    });
                }
            }).where({
                'order.id': [
                    1,
                    2
                ]
            }).orderBy('order.id').all();
        }).then(function (orders) {
            test.strictEqual(1, orders.length);
            test.equal(2, orders[0].get('id'));
            test.ok(orders[0].isRelationPopulated('customer'));

            // inner join filtering without eager loading
            return Order.find().innerJoinWith({
                customer(query) {
                    query.where('customer.id=2');
                }
            }, false).orderBy('order.id').all();
        }).then(function (orders) {
            test.strictEqual(2, orders.length);
            test.equal(2, orders[0].get('id'));
            test.equal(3, orders[1].get('id'));
            test.ok(!orders[0].isRelationPopulated('customer'));
            test.ok(!orders[1].isRelationPopulated('customer'));

            // inner join filtering without eager loading, conditions on both primary and relation
            return Order.find().innerJoinWith({
                customer(query) {
                    query.where({
                        'customer.id': 2
                    });
                }
            }, false).where({
                'order.id': [
                    1,
                    2
                ]
            }).orderBy('order.id').all();
        }).then(function (orders) {
            test.strictEqual(1, orders.length);
            test.equal(2, orders[0].get('id'));
            test.ok(!orders[0].isRelationPopulated('customer'));

            // join with via-relation
            return Order.find().innerJoinWith('books').orderBy('order.id').all();
        }).then(function (orders) {

            test.strictEqual(2, orders.length);
            test.equal(1, orders[0].get('id'));
            test.equal(3, orders[1].get('id'));
            test.ok(orders[0].isRelationPopulated('books'));
            test.ok(orders[1].isRelationPopulated('books'));

            return Promise.all([
                orders[0].getBooks().all(),
                orders[1].getBooks().all()
            ]);
        }).then(function (args) {
            test.strictEqual(2, args[0].length);
            test.strictEqual(1, args[1].length);

            // join with sub-relation
            return Order.find().innerJoinWith({
                items(q) {
                    q.orderBy('item.id');
                },
                'items.category'(q) {
                    q.where('category.id = 2');
                }
            }).orderBy('order.id').all();
        }).then(function (orders) {
            test.strictEqual(1, orders.length);
            test.ok(orders[0].isRelationPopulated('items'));
            test.equal(2, orders[0].get('id'));

            return orders[0].load('items');
        }).then(function (items) {
            test.strictEqual(3, items.length);
            test.ok(items[0].isRelationPopulated('category'));

            return items[0].load('category');
        }).then(function (category) {
            test.equal(2, category.get('id'));

            // join with table alias
            return Order.find().joinWith({
                customer(q) {
                    q.from('customer c');
                }
            }).orderBy('c.id DESC, order.id').all();
        }).then(function (orders) {
            test.strictEqual(3, orders.length);
            test.equal(2, orders[0].get('id'));
            test.equal(3, orders[1].get('id'));
            test.equal(1, orders[2].get('id'));
            test.ok(orders[0].isRelationPopulated('customer'));
            test.ok(orders[1].isRelationPopulated('customer'));
            test.ok(orders[2].isRelationPopulated('customer'));

            // join with ON condition
            return Order.find().joinWith('books2').orderBy('order.id').all();
        }).then(function (orders) {
            test.strictEqual(3, orders.length);
            test.equal(1, orders[0].get('id'));
            test.equal(2, orders[1].get('id'));
            test.equal(3, orders[2].get('id'));
            test.ok(orders[0].isRelationPopulated('books2'));
            test.ok(orders[1].isRelationPopulated('books2'));
            test.ok(orders[2].isRelationPopulated('books2'));
            test.strictEqual(2, orders[0].get('books2').length);
            test.strictEqual(0, orders[1].get('books2').length);
            test.strictEqual(1, orders[2].get('books2').length);

            // lazy loading with ON condition
            return Order.findOne(1);
        }).then(function (order) {

            return order.load('books2');
        }).then(function (books2) {
            test.strictEqual(2, books2.length);

            return Order.findOne(2);
        }).then(function (order) {

            return order.load('books2');
        }).then(function (books2) {
            test.strictEqual(0, books2.length);

            return Order.findOne(3);
        }).then(function (order) {

            return order.load('books2');
        }).then(function (books2) {
            test.strictEqual(1, books2.length);

            // eager loading with ON condition
            return Order.find().with('books2').all();
        }).then(function (orders) {
            test.strictEqual(3, orders.length);
            test.equal(1, orders[0].get('id'));
            test.equal(2, orders[1].get('id'));
            test.equal(3, orders[2].get('id'));
            test.ok(orders[0].isRelationPopulated('books2'));
            test.ok(orders[1].isRelationPopulated('books2'));
            test.ok(orders[2].isRelationPopulated('books2'));
            test.strictEqual(2, orders[0].get('books2').length);
            test.strictEqual(0, orders[1].get('books2').length);
            test.strictEqual(1, orders[2].get('books2').length);

            // join with count and query
            query = Order.find().joinWith('customer');

            return query.count();
        }).then(function (count) {
            test.strictEqual(3, count);

            return query.all();
        }).then(function (orders) {
            test.strictEqual(3, orders.length);

            // https://github.com/yiisoft/yii2/issues/2880
            return Order.findOne(1).then(function (order) {
                return order.getCustomer().joinWith({
                    orders(q) {
                        q.orderBy([]);
                    }
                }).one();
            });
        }).then(function (customer) {
            test.equal(1, customer.get('id'));

            return Order.find().joinWith({
                items(q) {
                    q.from({
                        items: 'item'
                    }).orderBy('items.id');
                }
            }).orderBy('order.id').one();
        }).then(function (order) {

            // join with sub-relation called inside Closure
            return Order.find().joinWith({
                items(q) {
                    q.orderBy('item.id');
                    q.joinWith({
                        category(q) {
                            q.where('category.id = 2');
                        }
                    });
                }
            }).orderBy('order.id').all();
        }).then(function (orders) {
            test.strictEqual(1, orders.length);

            test.ok(orders[0].isRelationPopulated('items'));
            test.equal(2, orders[0].get('id'));
            test.strictEqual(3, orders[0].get('items').length);
            test.ok(orders[0].get('items')[0].isRelationPopulated('category'));
            test.equal(2, orders[0].get('items')[0].get('category').get('id'));

            test.done();
        });
    }

    testJoinWithAndScope(test) {
        // hasOne inner join
        Customer.find().active().innerJoinWith('profile').orderBy('customer.id').all().then(function (customers) {
            test.strictEqual(1, customers.length);
            test.equal(1, customers[0].get('id'));
            test.ok(customers[0].isRelationPopulated('profile'));

            // hasOne outer join
            return Customer.find().active().joinWith('profile').orderBy('customer.id').all();
        }).then(function (customers) {
            test.strictEqual(2, customers.length);
            test.equal(1, customers[0].get('id'));
            test.equal(2, customers[1].get('id'));
            test.ok(customers[0].isRelationPopulated('profile'));
            test.ok(customers[1].isRelationPopulated('profile'));

            test.strictEqual(Profile.className(), customers[0].get('profile').className());
            test.strictEqual(null, customers[1].get('profile'));

            // hasMany
            return Customer.find().active().joinWith({
                orders(q) {
                    q.orderBy('order.id');
                }
            }).orderBy('customer.id DESC, order.id').all();
        }).then(function (customers) {
            test.strictEqual(2, customers.length);
            test.equal(2, customers[0].get('id'));
            test.equal(1, customers[1].get('id'));
            test.ok(customers[0].isRelationPopulated('orders'));
            test.ok(customers[1].isRelationPopulated('orders'));

            test.done();
        });
    }

    testInverseOf(test) {
        var order = null;
        var orders = null;
        var customer = null;
        var customers = null;

        // eager loading: find one and all
        Customer.find().with('orders2').where({
            id: 1
        }).one().then(function (c) {
            customer = c;

            return customer.get('orders2')[0].load('customer2');
        }).then(function (customer2) {
            test.strictEqual(customer2, customer);

            return Customer.find().with('orders2').where({
                id: [
                    1,
                    3
                ]
            }).all();
        }).then(function (cs) {
            customers = cs;

            return customers[0].get('orders2')[0].load('customer2');
        }).then(function (customer2) {
            test.ok(customer2 === customers[0]);
            test.ok(customers[1].get('orders2').isEmpty());

            // lazy loading
            return Customer.findOne(2);
        }).then(function (c) {
            customer = c;

            return customer.load('orders2');
        }).then(function (os) {
            orders = os;

            test.strictEqual(2, orders.length);

            return Promise.all([
                orders[0].load('customer2'),
                orders[1].load('customer2')
            ]);
        }).then(function (args) {
            test.ok(args[0] === customer);
            test.ok(args[1] === customer);

            // ad-hoc lazy loading
            return Customer.findOne(2);
        }).then(function (c) {
            customer = c;

            return customer.load('orders2');
        }).then(function (os) {
            orders = os;

            test.strictEqual(2, orders.length);

            return Promise.all([
                orders[0].load('customer2'),
                orders[1].load('customer2')
            ]);
        }).then(function (args) {
            test.ok(args[0] === customer);
            test.ok(args[1] === customer);

            // the other way around
            return Customer.find().with('orders2').where({
                id: 1
            }).asArray().one();
        }).then(function (c) {
            customer = c;

            test.strictEqual(customer['orders2'][0]['customer2']['id'], customer['id']);

            return Customer.find().with('orders2').where({
                id: [
                    1,
                    3
                ]
            }).asArray().all();
        }).then(function (customers) {

            test.strictEqual(customer['orders2'][0]['customer2']['id'], customers[0]['id']);
            test.ok(_isEmpty(customers[1]['orders2']));

            return Order.find().with('customer2').where({
                id: 1
            }).all();
        }).then(function (os) {
            orders = os;

            test.ok(orders[0].get('customer2').get('orders2')[0] === orders[0]);

            return Order.find().with('customer2').where({
                id: 1
            }).one();
        }).then(function (o) {
            order = o;

            return order.get('customer2').load('orders2');
        }).then(function (orders2) {
            test.ok(orders2[0] === order);

            return Order.find().with('customer2').where({
                id: 1
            }).asArray().all();
        }).then(function (os) {
            orders = os;

            test.ok(orders[0]['customer2']['orders2'][0]['id'] === orders[0]['id']);

            return Order.find().with('customer2').where({
                id: 1
            }).asArray().one();
        }).then(function (order) {
            test.ok(order['customer2']['orders2'][0]['id'] === orders[0]['id']);

            return Order.find().with('customer2').where({
                id: [
                    1,
                    3
                ]
            }).all();
        }).then(function (os) {
            orders = os;

            return Promise.all([
                orders[0].get('customer2').load('orders2'),
                orders[1].get('customer2').load('orders2')
            ]);
        }).then(function (args) {
            test.ok(args[0][0] === orders[0]);
            test.ok(args[1][0] === orders[1]);

            return Order.find().with('customer2').where({
                id: [
                    2,
                    3
                ]
            }).orderBy('id').all();
        }).then(function (os) {
            orders = os;

            return Promise.all([
                orders[0].get('customer2').load('orders2'),
                orders[1].get('customer2').load('orders2')
            ]);
        }).then(function (args) {
            test.ok(args[0][0] === orders[0]);
            test.ok(args[1][0] === orders[0]);

            return Order.find().with('customer2').where({
                id: [
                    2,
                    3
                ]
            }).orderBy('id').asArray().all();
        }).then(function (orders) {
            test.strictEqual(orders[0]['customer2']['orders2'][0]['id'], orders[0]['id']);
            test.strictEqual(orders[0]['customer2']['orders2'][1]['id'], orders[1]['id']);
            test.strictEqual(orders[1]['customer2']['orders2'][0]['id'], orders[0]['id']);
            test.strictEqual(orders[1]['customer2']['orders2'][1]['id'], orders[1]['id']);

            test.done();
        });
    }

    testDefaultValues(test) {
        var model = new Type();
        model.loadDefaultValues();
        test.equal(1, model.get('int_col2'));
        test.strictEqual('something', model.get('char_col2'));
        test.strictEqual(1.23, model.get('float_col2'));
        test.strictEqual(33.22, model.get('numeric_col'));
        test.strictEqual(1, model.get('bool_col2'));
        test.strictEqual('2002-01-01 00:00:00', model.get('time'));

        model = new Type();
        model.set('char_col2', 'not something');

        model.loadDefaultValues();
        test.strictEqual('not something', model.get('char_col2'));

        model = new Type();
        model.set('char_col2', 'not something');

        model.loadDefaultValues(false);
        test.strictEqual('something', model.get('char_col2'));

        test.done();
    }

    testUnlinkAllViaTable(test) {
        /** @typedef {Jii.data.ActiveRecord} orderClass */
        var orderClass = this.getOrderClass();

        /** @typedef {Jii.data.ActiveRecord} orderItemClass */
        var orderItemClass = this.getOrderItemClass();

        /** @typedef {Jii.data.ActiveRecord} itemClass */
        var itemClass = this.getItemClass();

        /** @typedef {Jii.data.ActiveRecord} orderItemsWithNullFKClass */
        var orderItemsWithNullFKClass = this.getOrderItemWithNullFKmClass();

        var order = null;
        var orderItemCount = null;

        // via table with delete
        /** @typedef {Order} order */
        orderClass.findOne(1).then(function (o) {
            order = o;

            return order.load('booksViaTable');
        }).then(function (booksViaTable) {
            test.strictEqual(2, booksViaTable.length);

            return orderItemClass.find().count();
        }).then(function (oic) {
            orderItemCount = oic;

            return itemClass.find().count();
        }).then(function (count) {
            test.strictEqual(5, count);

            return order.unlinkAll('booksViaTable', true);
        }).then(function () {
            this.afterSave();

            return itemClass.find().count();
        }.bind(this)).then(function (count) {
            test.strictEqual(5, count);

            return orderItemClass.find().count();
        }.bind(this)).then(function (count) {
            test.strictEqual(orderItemCount - 2, count);

            return order.load('booksViaTable');
        }).then(function (booksViaTable) {
            test.strictEqual(0, booksViaTable.length);

            // via table without delete
            return order.load('booksWithNullFKViaTable');
        }).then(function (booksWithNullFKViaTable) {
            test.strictEqual(2, booksWithNullFKViaTable.length);

            return orderItemsWithNullFKClass.find().count();
        }).then(function (orderItemCount) {

            return itemClass.find().count();
        }).then(function (count) {
            test.strictEqual(5, count);

            return order.unlinkAll('booksWithNullFKViaTable', false);
        }).then(function () {
            this.afterSave();

            return order.load('booksWithNullFKViaTable');
        }.bind(this)).then(function (booksWithNullFKViaTable) {
            test.strictEqual(0, booksWithNullFKViaTable.length);

            return orderItemsWithNullFKClass.find().where([
                'AND',
                {
                    item_id: [
                        1,
                        2
                    ]
                },
                {
                    order_id: null
                }
            ]).count();
        }).then(function (count) {
            test.strictEqual(2, count);

            return orderItemsWithNullFKClass.find().count();
        }).then(function (count) {
            test.strictEqual(orderItemCount, count);

            return itemClass.find().count();
        }).then(function (count) {
            test.strictEqual(5, count);

            test.done();
        });
    }

    testCastValues(test) {
        var model = new Type();
        model.set('int_col', 123);
        model.set('int_col2', 456);
        model.set('smallint_col', 42);
        model.set('char_col', '1337');
        model.set('char_col2', 'test');
        model.set('char_col3', 'test123');
        model.set('float_col', 3.742);
        model.set('float_col2', 42.1337);
        model.set('bool_col', true);
        model.set('bool_col2', false);

        model.save(false).then(function () {

            /** @typedef {Type} model */
            return Type.find().one();
        }).then(function (model) {

            test.strictEqual(123, model.get('int_col'));
            test.strictEqual(456, model.get('int_col2'));
            test.strictEqual(42, model.get('smallint_col'));
            test.strictEqual('1337', _trim(model.get('char_col')));
            test.strictEqual('test', model.get('char_col2'));
            test.strictEqual('test123', model.get('char_col3'));
            //        this.assertSame(1337.42, model.float_col);
            //        this.assertSame(42.1337, model.float_col2);
            //        this.assertSame(true, model.bool_col);
            //        this.assertSame(false, model.bool_col2);

            test.done();
        });
    }

    testIssues(test) {
        // https://github.com/yiisoft/yii2/issues/4938

        var category = null;
        var orders = null;

        Category.findOne(2).then(function (c) {
            category = c;

            test.ok(category instanceof Category);

            return category.getItems().count();
        }).then(function (count) {
            test.strictEqual(3, count);

            return category.getLimitedItems().count();
        }).then(function (count) {
            test.strictEqual(1, count);

            return category.getLimitedItems().distinct(true).count();
        }).then(function (count) {
            test.strictEqual(1, count);

            // https://github.com/yiisoft/yii2/issues/3197
            return Order.find().with('orderItems').orderBy('id').all();
        }).then(function (o) {
            orders = o;

            test.strictEqual(3, orders.length);

            return orders[0].load('orderItems');
        }).then(function (orderItems) {
            test.strictEqual(2, orderItems.length);

            return orders[1].load('orderItems');
        }).then(function (orderItems) {
            test.strictEqual(3, orderItems.length);

            return orders[2].load('orderItems');
        }).then(function (orderItems) {
            test.strictEqual(1, orderItems.length);

            return Order.find().with({
                orderItems(q) {
                    q.indexBy('item_id');
                }
            }).orderBy('id').all();
        }).then(function (o) {
            orders = o;

            test.strictEqual(3, orders.length);

            return orders[0].load('orderItems');
        }).then(function (orderItems) {
            test.strictEqual(2, _keys(orderItems).length);

            return orders[1].load('orderItems');
        }).then(function (orderItems) {
            test.strictEqual(3, _keys(orderItems).length);

            return orders[2].load('orderItems');
        }).then(function (orderItems) {
            test.strictEqual(1, _keys(orderItems).length);

            test.done();
        });
    }

}
module.exports = new self().exports();