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
var _has = require('lodash/has');

/**
 * DataProvider provides a base class that implements the [[DataProviderInterface]].
 *
 * @class Jii.data.DataProvider
 * @extends Jii.base.Collection
 */
var DataProvider = Jii.defineClass('Jii.data.DataProvider', /** @lends Jii.data.DataProvider.prototype */{

    __extends: Collection,

    __static: /** @lends Jii.data.DataProvider */{

        /**
         * @event Jii.data.DataProvider#before_fetch
         * @property {Jii.data.FetchEvent} event
         */
        EVENT_BEFORE_FETCH: 'before_fetch',

        /**
         * @event Jii.data.DataProvider#after_fetch
         * @property {Jii.data.FetchEvent} event
         */
        EVENT_AFTER_FETCH: 'after_fetch',

        /**
         * @event Jii.data.DataProvider#loading
         * @property {Jii.data.FetchEvent} event
         */
        EVENT_LOADING: 'loading',

    },

    /**
     * @type {string|null} an ID that uniquely identifies the data provider among all data providers.
     * You should set this property if the same page contains two or more different data providers.
     * Otherwise, the [[pagination]] and [[sort]] may not work properly.
     */
    id: null,

    /**
     * @type {function|Jii.data.Query}
     */
    query: null,

    /**
     * @type {boolean}
     */
    autoFetch: true,

    /**
     * @type {Jii.data.Sort}
     */
    _sort: null,

    /**
     * @type {Jii.data.Pagination|boolean}
     */
    _pagination: null,

    /**
     * @type {number|null}
     */
    _totalCount: 0,

    /**
     * @type {function[]|null}
     */
    _fetchCallbacks: null,

    /**
     * @type {object}
     */
    _fetchedKeys: {},

    init() {
        if (this.autoFetch) {
            this.fetch();
        }
    },

    /**
     *
     * @param {boolean} [force]
     * @return {*}
     */
    fetch(force = false) {
        // Queue promises when fetch in process
        if (this._fetchCallbacks !== null) {
            return new Promise(resolve => {
                this._fetchCallbacks.push(resolve)
            });
        }

        if (this.isFetched() && !force) {
            return Promise.resolve(false);
        }

        this.trigger(this.__static.EVENT_BEFORE_FETCH, new FetchEvent({
            isLoading: true
        }));
        this.trigger(this.__static.EVENT_LOADING, new FetchEvent({
            isLoading: true
        }));

        this._fetchCallbacks = [];
        return Promise.resolve()
            .then(() => {

                // Query as function
                if (_isFunction(this.query)) {
                    return this.query(this.getPagination());
                }

                // TODO Query, REST, ...
                throw new InvalidConfigException('Wrong query format in DataProvider.');
            })
            .then(data => {
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
                    this.trigger(this.__static.EVENT_FETCHED, this._createEvent({
                        isFetch: true
                    }));
                } else {
                    this.setModels(data.models);
                }

                // Resolve queue promises after current
                var callbacks = this._fetchCallbacks;
                this._fetchCallbacks = null;
                setTimeout(() => {
                    callbacks.forEach(callback => {
                        callback(data.models);
                    });
                });

                this.trigger(this.__static.EVENT_AFTER_FETCH, new FetchEvent({
                    isLoading: false
                }));
                this.trigger(this.__static.EVENT_LOADING, new FetchEvent({
                    isLoading: false
                }));

                return data;
            });
    },

    isFetched() {
        if (!this.__super()) {
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
    },

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
    },

    /**
     * Sets the total number of data models.
     * @param {number} value the total number of data models.
     */
    setTotalCount(value) {
        this._totalCount = value;

        if (this._pagination) {
            this._pagination.totalCount = value;
        }
    },

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
    },

    /**
     * Sets the pagination for this data provider.
     * @param {object|Jii.data.Pagination|boolean} value the pagination to be used by this data provider.
     * @throws InvalidParamException
     */
    setPagination(value) {
        if (_isObject(value)) {
            let config = {
                className: Pagination,
                totalCount: this.getTotalCount(),
            };
            if (this.id !== null) {
                config.pageParam = `${this.id}-page`;
                config.pageSizeParam = `${this.id}-per-page`;
            }
            this._pagination = Jii.createObject(Jii.mergeConfigs(config, value));
        } else if (value instanceof Pagination || value === false) {
            this._pagination = value;
        } else {
            throw new InvalidParamException('Only Pagination instance, configuration object or false is allowed.');
        }

        this._pagination.on(Pagination.EVENT_CHANGE, this._onPaginationChange.bind(this));
    },

    /**
     * @returns {Jii.data.Sort|boolean} the sorting object. If this is false, it means the sorting is disabled.
     */
    getSort() {
        if (this._sort === null) {
            this.setSort({});
        }

        return this._sort;
    },

    /**
     * Sets the sort definition for this data provider.
     * @param {object|Jii.data.Sort|boolean} value the sort definition to be used by this data provider.
     * This can be one of the following:
     *
     * - a configuration array for creating the sort definition object. The "class" element defaults
     *   to 'jii\data\Sort'
     * - an instance of [[Sort]] or its subclass
     * - false, if sorting needs to be disabled.
     *
     * @throws InvalidParamException
     */
    setSort(value) {
        if (_isObject(value)) {
            let config = {/*className: Sort*/}; // @todo Sort implementation
            if (this.id !== null) {
                config.sortParam = `${this.id}-sort`;
            }
            this._sort = Jii.createObject(Jii.mergeConfigs(config, value));
        } else if (/*value instanceof Sort ||*/ value === false) { // @todo Sort implementation
            this._sort = value;
        } else {
            throw new InvalidParamException('Only Sort instance, configuration object or false is allowed.');
        }
    },

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

        this.__super(startIndex, toAdd, toRemove, unique);
    },

    _onPaginationChange() {
        this.refreshFilter();

        if (this.autoFetch) {
            this.fetch();
        }
    },

    _filterModels() {
        var pagination = this.getPagination();
        if (pagination) {
            if (!this.parent) {
                throw new InvalidConfigException('DataProvider with pagination need parent collection.');
            }

            return pagination.getIndexes()
                .map(i => {
                    return this.parent._byId[this._fetchedKeys[i]] || null;
                })
                .filter(model => model !== null);
        }

        return this.__super();
    },

    /**
     *
     * @param {object} params
     * @returns {Jii.data.CollectionEvent}
     */
    _createEvent(params) {
        params.totalCount = this.getTotalCount();
        return new DataProviderEvent(params);
    },

});

module.exports = DataProvider;