'use strict';

const Jii = require('../../index');
const Article = require('../models/Article');
const Pagination = require('../../data/Pagination');
const Collection = require('../../base/Collection');
const InvalidParamException = require('../../exceptions/InvalidParamException');
const ChangeEvent = require('../../data/ChangeEvent');
const Query = require('../../data/Query');
const UnitTest = require('../../base/UnitTest');
require('../bootstrap');
class DataProviderTest extends UnitTest {

    fetchTest(test) {
        var fetchCount = 0;
        var collection = new Collection(null, {
            modelClass: Article
        });
        test.strictEqual(collection.isFetched(), false);

        var dataProvider = collection.createDataProvider({
            query: pagination => {
                fetchCount++;
                return new Promise(resolve => {
                    resolve({
                        totalCount: 14,
                        models: this._generateData(pagination.getPage() * 10, pagination.getPage() === 0 ? 10 : 14)
                    });
                });
            },
            pagination: {
                pageSize: 10
            }
        });

        test.strictEqual(collection.isFetched(), false);
        test.strictEqual(dataProvider.isFetched(), false);
        test.strictEqual(fetchCount, 0);

        dataProvider.fetch().then(() => {
            test.strictEqual(collection.isFetched(), true);
            test.strictEqual(dataProvider.isFetched(), true);
            test.strictEqual(fetchCount, 1);

            test.strictEqual(collection.length, 10);
            test.strictEqual(dataProvider.length, 10);

            // Fetch new page
            dataProvider.getPagination().setPage(1);
            return dataProvider.fetch();
        }).then(() => {

            test.strictEqual(collection.length, 14);
            test.strictEqual(dataProvider.length, 4);
            test.strictEqual(fetchCount, 2);

            // Check no fetch previous page
            dataProvider.getPagination().setPage(0);
            return dataProvider.fetch();
        }).then(() => {

            test.strictEqual(dataProvider.length, 10);
            test.strictEqual(fetchCount, 2);

            // Check no fetch end page (where length < pageSize)
            dataProvider.getPagination().setPage(1);
            return dataProvider.fetch();
        }).then(() => {

            test.strictEqual(dataProvider.length, 4);
            test.strictEqual(fetchCount, 2);

            // Remove from parent and fetch
            collection.remove({
                id: 'id5'
            });
            test.strictEqual(dataProvider.length, 4);
            dataProvider.getPagination().setPage(0);

            return dataProvider.fetch();
        }).then(() => {

            test.strictEqual(dataProvider.length, 10);
            test.strictEqual(fetchCount, 3);

            // Update page size
            dataProvider.getPagination().setPageSize(5);
            test.strictEqual(dataProvider.getPagination().getPageCount(), 3);
            test.strictEqual(dataProvider.length, 5);

            // Set page 2, check no fetch
            dataProvider.getPagination().setPage(2);

            return dataProvider.fetch();
        }).then(() => {

            test.strictEqual(dataProvider.length, 4);
            test.strictEqual(fetchCount, 3);

            dataProvider.getPagination().mode = Pagination.MODE_LOAD_MORE;
            dataProvider.refreshFilter();

            test.strictEqual(dataProvider.length, 14);
            dataProvider.getPagination().setPage(0);
            test.strictEqual(dataProvider.length, 5);

            test.done();
        });
    }

    _generateData(from, to) {
        var data = [];
        for (var i = from; i < to; i++) {
            data.push({
                id: 'id' + i,
                title: 'test' + i
            });
        }
        return data;
    }

}
module.exports = new DataProviderTest().exports();