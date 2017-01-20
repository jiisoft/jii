/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var InvalidConfigException = require('../exceptions/InvalidConfigException');
var InvalidParamException = require('../exceptions/InvalidParamException');
var Collection = require('../base/Collection');
var Pagination = require('../data/Pagination');
var FetchEvent = require('../data/FetchEvent');
var DataProviderEvent = require('../data/DataProviderEvent');
var _isNumber = require('lodash/isNumber');
var _isArray = require('lodash/isArray');
var _isObject = require('lodash/isObject');
var _isFunction = require('lodash/isFunction');
var _findKey = require('lodash/findKey');
var _orderBy = require('lodash/orderBy');
var _has = require('lodash/has');
var _isEqual = require('lodash/isEqual');

class DataProvider extends Collection {

    preInit() {
        /**
         * @type {object}
         */
        this._fetchedKeys = {};

        /**
         * @type {function[]|null}
         */
        this._fetchCallbacks = null;

        /**
         * @type {number|null}
         */
        this._totalCount = 0;

        /**
         * @type {Jii.data.Pagination|boolean}
         */
        this._pagination = null;

        /**
         * @type {Array|string}
         */
        this._sort = null;

        /**
         * @type {Array|string}
         */
        this._sortDirection = null;

        /**
         * @type {boolean}
         */
        this.autoFetch = true;

        /**
         * @type {function|Jii.data.Query}
         */
        this.query = null;

        /**
         * @type {string|null} an ID that uniquely identifies the data provider among all data providers.
         * You should set this property if the same page contains two or more different data providers.
         * Otherwise, the [[pagination]] and [[sort]] may not work properly.
         */
        this.id = null;

        super.preInit(...arguments);
    }

    init() {
        if (this.autoFetch) {
            this.fetch();
        }
    }

    /**
     *
     * @param {boolean} [force]
     * @return {*}
     */
    fetch(force) {
        // Queue promises when fetch in process
        if (this._fetchCallbacks !== null) {
            return new Promise(resolve => {
                this._fetchCallbacks.push(resolve);
            });
        }

        if (this.isFetched() && !force) {
            this.refreshFilter();
            return Promise.resolve(false);
        }

        this.trigger(DataProvider.EVENT_BEFORE_FETCH, new FetchEvent({
            isLoading: true
        }));
        this.trigger(DataProvider.EVENT_LOADING, new FetchEvent({
            isLoading: true
        }));

        this._fetchCallbacks = [];
        return Promise.resolve().then(() => {

            // Query as function
            if (_isFunction(this.query)) {
                return this.query(this.getPagination());
            }

            // TODO Query, REST, ...
            throw new InvalidConfigException('Wrong query format in DataProvider.');
        }).then(data => {
            // Validate response
            if (!data) {
                throw new InvalidParamException('Result data is not object in DataProvider.fetch().');
            }
            if (data.totalCount && !_isNumber(data.totalCount)) {
                throw new InvalidParamException('Result param "totalCount" must be number in DataProvider.fetch().');
            }
            if (!_isArray(data.models)) {
                throw new InvalidParamException('Result param "models" must be array in DataProvider.fetch().');
            }

            if (_isNumber(data.totalCount)) {
                this.setTotalCount(data.totalCount);
            }

            // No changes, but fetch
            if (!this.isFetched() && data.models.length === 0 && this.length === 0) {
                this.trigger(DataProvider.EVENT_FETCHED, this._createEvent({
                    isFetch: true
                }));
            } else {
                this.setModels(data.models);
                this.refreshFilter();
            }

            // Resolve queue promises after current
            var callbacks = this._fetchCallbacks;
            this._fetchCallbacks = null;
            setTimeout(() => {
                callbacks.forEach(callback => {
                    callback(data.models);
                });
            });

            this.trigger(DataProvider.EVENT_AFTER_FETCH, new FetchEvent({
                isLoading: false
            }));
            this.trigger(DataProvider.EVENT_LOADING, new FetchEvent({
                isLoading: false
            }));

            return data;
        });
    }

    isFetched() {
        if (!super.isFetched()) {
            return false;
        }

        var pagination = this.getPagination();
        if (pagination) {
            let needFetch = false;
            pagination.getIndexes().forEach(index => {
                if (!_has(this._fetchedKeys, index.toString()) && index < this.getTotalCount() - 1) {
                    needFetch = true;
                }
            });
            return !needFetch;
        }

        return true;
    }

    /**
     * Returns the total number of data models.
     * When [[pagination]] is false, this returns the same value as [[count]].
     * Otherwise, it will call [[prepareTotalCount()]] to get the count.
     * @returns {number} total number of possible data models.
     */
    getTotalCount() {
        if (this._pagination === false) {
            return this.parent ? this.parent.getCount() : this.getCount();
        }
        return this._totalCount;
    }

    /**
     * Sets the total number of data models.
     * @param {number} value the total number of data models.
     */
    setTotalCount(value) {
        this._totalCount = value;

        if (this._pagination) {
            this._pagination.totalCount = value;
        }
    }

    /**
     * Returns the pagination object used by this data provider.
     * Note that you should call [[prepare()]] or [[getModels()]] first to get correct values
     * of [[Pagination.totalCount]] and [[Pagination.pageCount]].
     * @returns {Jii.data.Pagination|boolean} the pagination object. If this is false, it means the pagination is disabled.
     */
    getPagination() {
        if (this._pagination === null) {
            this.setPagination({});
        }

        return this._pagination;
    }

    /**
     * Sets the pagination for this data provider.
     * @param {object|Jii.data.Pagination|boolean} value the pagination to be used by this data provider.
     * @throws InvalidParamException
     */
    setPagination(value) {
        if (_isObject(value)) {
            let config = {
                className: Pagination,
                totalCount: this.getTotalCount()
            };
            if (this.id !== null) {
                config.pageParam = `${ this.id }-page`;
                config.pageSizeParam = `${ this.id }-per-page`;
            }
            this._pagination = Jii.createObject(Jii.mergeConfigs(config, value));
        } else if (value instanceof Pagination || value === false) {
            this._pagination = value;
        } else {
            throw new InvalidParamException('Only Pagination instance, configuration object or false is allowed.');
        }

        if(this._pagination){
            this._pagination.on(Pagination.EVENT_CHANGE, this._onPaginationChange.bind(this));
        }
    }

    /**
     * @returns {Jii.data.Sort|boolean} the sorting object. If this is false, it means the sorting is disabled.
     */
    getSort() {
        if (this._sort === null) {
            this.setSort({});
        }

        return this._sort;
    }

    /**
     * Sets the sort definition for this data provider.
     * @param {Array, string} attributes
     * @param {Array, string} [directions]
     */
    setSort(attributes, directions = null) {
        if(typeof(attributes) == 'function'){
            this._sort = attributes;
        } else if(typeof(attributes) == 'string'){
            this._sort = (model) => model.get(attributes);
        } else if(typeof(attributes) == 'Array'){
            this._sort = (model) => attributes.map(attribute => model.get(attribute));
        } else {
            throw new InvalidParamException('attributes the wrong type of format! see params lodash.com orderBy.');
        }

        this._sortDirection = directions;
    }

    _onSort(){
        const sortedArray = _orderBy(this, this._sort, this._sortDirection);
        for(let index in sortedArray){
            if(sortedArray.hasOwnProperty(index)){
                if(!_isEqual(sortedArray[index].getAttributes(), this[index].getAttributes())){
                    this._change(this.length, sortedArray, this.getModels(), true);
                    return;
                }
            }
        }
    }

    _change(startIndex, toAdd, toRemove, unique, parentCallParams) {
        if (parentCallParams) {
            var pagination = this.getPagination();
            if (pagination) {
                toRemove.forEach(model => {
                    let primaryKey = this._getPrimaryKey(model);
                    var finedKey = _findKey(this._fetchedKeys, key => {
                        return key === primaryKey;
                    });
                    if (finedKey) {
                        delete this._fetchedKeys[finedKey];
                    }
                });

                parentCallParams.toAdd.forEach((model, index) => {
                    this._fetchedKeys[index + pagination.getOffset()] = this._getPrimaryKey(model);
                });

                this.refreshFilter();
                return;
            }
        }

        super._change(startIndex, toAdd, toRemove, unique);
    }

    _onPaginationChange() {
        if (this.autoFetch) {
            this.fetch();
        }
    }

    _filterModels() {
        var pagination = this.getPagination();
        if (pagination) {
            if (!this.parent) {
                throw new InvalidConfigException('DataProvider with pagination need parent collection.');
            }

            return pagination.getIndexes().map(i => {
                return this.parent._byId[this._fetchedKeys[i]] || null;
            }).filter(model => model !== null);
        }

        return super._filterModels();
    }

    /**
     *
     * @param {object} params
     * @returns {Jii.data.CollectionEvent}
     */
    _createEvent(params) {
        params.totalCount = this.getTotalCount();
        return new DataProviderEvent(params);
    }

}

/**
 * @event Jii.data.DataProvider#loading
 * @property {Jii.data.FetchEvent} event
 */
DataProvider.EVENT_LOADING = 'loading';

/**
 * @event Jii.data.DataProvider#after_fetch
 * @property {Jii.data.FetchEvent} event
 */
DataProvider.EVENT_AFTER_FETCH = 'after_fetch';

/**
 * @event Jii.data.DataProvider#before_fetch
 * @property {Jii.data.FetchEvent} event
 */
DataProvider.EVENT_BEFORE_FETCH = 'before_fetch';
module.exports = DataProvider;