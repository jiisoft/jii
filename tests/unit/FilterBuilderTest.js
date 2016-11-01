'use strict';

var Jii = require('../../BaseJii');
var FilterBuilder = require('../../data/FilterBuilder');
var Query = require('../../data/Query');
var Collection = require('../../base/Collection');
var Article = require('../models/Article');
var UnitTest = require('../../base/UnitTest');

require('../bootstrap');

/**
 * @class tests.unit.FilterBuilderTest
 * @extends Jii.base.UnitTest
 */
var self = Jii.defineClass('tests.unit.FilterBuilderTest', {

    __extends: UnitTest,

    conditionHashTest: function (test) {
        var filterBuilder = new FilterBuilder();

        var query = new Query();
        query.where({foo: 5});

        test.deepEqual(filterBuilder.attributes(query), ['foo']);

        test.strictEqual(filterBuilder.filter({foo: 3}, query), false);
        test.strictEqual(filterBuilder.filter({foo: 5}, query), true);
        test.strictEqual(filterBuilder.filter({bar: 5}, query), false);

        test.done();
    },

    conditionAndTest: function (test) {
        var filterBuilder = new FilterBuilder();

        var query = new Query();
        query.where({foo: 5});
        query.andWhere({bar: 2});
        query.orWhere({zaa: 10});

        test.deepEqual(filterBuilder.attributes(query), ['foo', 'bar', 'zaa']);

        test.strictEqual(filterBuilder.filter({foo: 5}, query), false);
        test.strictEqual(filterBuilder.filter({foo: 5, bar: 2}, query), true);
        test.strictEqual(filterBuilder.filter({zaa: 10}, query), true);
        test.strictEqual(filterBuilder.filter({foo: 3, bar: 3, zaa: 10}, query), true);

        test.done();
    },

    conditionNotTest: function (test) {
        var filterBuilder = new FilterBuilder();

        var query = new Query();
        query.where({foo: 5});
        query.andWhere(['not', {bar: 2}]);

        test.deepEqual(filterBuilder.attributes(query), ['foo', 'bar']);

        test.strictEqual(filterBuilder.filter({foo: 5}, query), true);
        test.strictEqual(filterBuilder.filter({foo: 5, bar: 2}, query), false);
        test.strictEqual(filterBuilder.filter({foo: 5, bar: 3}, query), true);

        test.done();
    },

    conditionBetweenTest: function (test) {
        var filterBuilder = new FilterBuilder();

        var query = new Query();
        query.andWhere(['between', 'foo', 10, 20]);
        query.andWhere(['not between', 'foo', 15, 25]);

        test.deepEqual(filterBuilder.attributes(query), ['foo']);

        test.strictEqual(filterBuilder.filter({foo: 10}, query), true);
        test.strictEqual(filterBuilder.filter({foo: 13}, query), true);
        test.strictEqual(filterBuilder.filter({foo: 15}, query), false);
        test.strictEqual(filterBuilder.filter({foo: 20}, query), false);
        test.strictEqual(filterBuilder.filter({foo: 25}, query), false);

        test.done();
    },

    conditionInTest: function (test) {
        var filterBuilder = new FilterBuilder();

        var query = new Query();
        query.where(['in', 'foo', [1, 2, 3, 4]]);

        test.deepEqual(filterBuilder.attributes(query), ['foo']);

        test.strictEqual(filterBuilder.filter({foo: 3}, query), true);
        test.strictEqual(filterBuilder.filter({foo: 13}, query), false);

        test.done();
    },

    relationTest: function(test) {
        var filterBuilder = new FilterBuilder();

        var article = new Article({id: 10, userId: 50});

        // hasOne
        var hasOneQuery = article.getUser();
        filterBuilder.prepare(hasOneQuery);
        test.deepEqual(filterBuilder.attributes(hasOneQuery), ['id']);
        test.strictEqual(filterBuilder.filter({id: 49}, hasOneQuery), false);
        test.strictEqual(filterBuilder.filter({id: 50}, hasOneQuery), true);

        //var hasManyQuery = article.getLinks();
        //console.log(filterBuilder.attributes(hasManyQuery), hasManyQuery.getWhere());


        test.done();
    },

    relationTimeTest: function(test) {
        var filterBuilder = new FilterBuilder();
        Article.getDb = function() {
            return {
                getSchema: function() {
                    return {
                        getFilterBuilder: function() {
                            return filterBuilder;
                        }
                    }
                }
            }
        };

        var collection = new Collection([], {modelClass: Article});
        for (var i = 0; i < 1000; i++) {
            collection.add({
                id: i,
                userId: i+30,
                title: 't i t l e ' + i
            });
        }

        var query = (new Query())
            .where(['in', 'id', 50]);
        collection.setFilter(query);

        console.time('filter');
            collection.refreshFilter();
        console.timeEnd('filter');

        test.done();
    }



});

module.exports = new self().exports();
