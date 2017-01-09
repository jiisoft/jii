/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const InvalidParamException = require('../exceptions/InvalidParamException');
const CollectionEvent = require('../data/CollectionEvent');
const InvalidConfigException = require('../exceptions/InvalidConfigException');
const NotSupportedException = require('../exceptions/NotSupportedException');
const _isArray = require('lodash/isArray');
const _isObject = require('lodash/isObject');
const _isFunction = require('lodash/isFunction');
const _isString = require('lodash/isString');
const _indexOf = require('lodash/indexOf');
const _toArray = require('lodash/toArray');
const _reduceRight = require('lodash/reduceRight');
const _groupBy = require('lodash/groupBy');
const _countBy = require('lodash/countBy');
const _lastIndexOf = require('lodash/lastIndexOf');
const _findIndex = require('lodash/findIndex');
const _findLastIndex = require('lodash/findLastIndex');
const _has = require('lodash/has');
const _each = require('lodash/each');
const _map = require('lodash/map');
const _filter = require('lodash/filter');
const _reduce = require('lodash/reduce');
const _find = require('lodash/find');
const _reject = require('lodash/reject');
const _every = require('lodash/every');
const _some = require('lodash/some');
const _maxBy = require('lodash/maxBy');
const _minBy = require('lodash/minBy');
const _first = require('lodash/first');
const _initial = require('lodash/initial');
const _last = require('lodash/last');
const _drop = require('lodash/drop');
const _shuffle = require('lodash/shuffle');
const _sortBy = require('lodash/sortBy');
const _without = require('lodash/without');
const _extend = require('lodash/extend');
const Component = require('../base/Component');

class Collection extends Component {

    preInit(models, config) {
        this._editedEvents = [];
        this._childCollections = [];
        this._editedLevel = 0;
        this._eventsChangeName = [];
        this._filter = null;
        this._byId = {};

        /**
         * @type {boolean}
         */
        this._isFetched = false;

        /**
         * Root collection
         * @type {Jii.base.Collection}
         */
        this.parent = null;

        /**
         * @type {string|Jii.base.Model}
         */
        this.modelClass = null;

        /**
         * @type {number}
         */
        this.length = 0;

        super.preInit(config);

        if (_isArray(models)) {
            this.add(models);
        }
    }

    /**
     * @returns {[]|object}
     */
    getModels() {
        return this.map(model => model);
    }

    /**
     *
     * @param {object|object[]|Jii.base.Model|Jii.base.Model[]} models
     */
    setModels(models) {
        if (!_isArray(models)) {
            models = [models];
        }

        if (this.parent) {
            this.parent.setModels(models);
        } else {
            this._change(this.length, models, [], true);
        }
    }

    /**
     *
     * @param {object|object[]|Jii.base.Model|Jii.base.Model[]} models
     * @param {number} [index]
     * @returns {Jii.base.Model[]}
     */
    add(models, index) {
        if (!_isArray(models)) {
            models = [models];
        }

        if (this.parent) {
            this.parent.add(models, index);
        } else {
            if (!index && index !== 0) {
                index = this.length;
            }

            return this._change(index, models, []).added;
        }
    }

    /**
     *
     * @param {*|*[]} models
     * @returns {Jii.base.Model[]}
     */
    remove(models) {
        if (!_isArray(models)) {
            models = [models];
        }
        if (this.parent) {
            this.parent.remove(models);
        } else {
            return this._change(0, [], models).removed;
        }
    }

    /**
     *
     * @param {string|object|object[]} name
     * @param {*} [value]
     * @returns {*}
     */
    set(name, value) {
        // Format [0].name
        var indexFormat = this._detectKeyFormatIndex(name);
        if (indexFormat) {
            var model = this.at(indexFormat.index);
            if (model) {
                return model.set(indexFormat.subName, value);
            }

            throw new InvalidParamException('Not found model with index `' + indexFormat.index + '` for set attribute `' + indexFormat.subName + '`.');
        }

        // Object format
        if (_isObject(name) && !_has(name, 'modelClass')) {
            return this.setModels(name);
        }

        // Array format
        if (_isArray(name)) {
            return this.setModels(name);
        }

        return super.set(name, value);
    }

    /**
     *
     * @param {string} name
     * @returns {*}
     */
    get(name) {
        // Format [0].name
        var indexFormat = this._detectKeyFormatIndex(name);
        if (indexFormat) {
            var model = this.at(indexFormat.index);
            if (model) {
                return indexFormat.subName ? model.get(indexFormat.subName) : model;
            }
            return null;
        }

        // Get by pk
        var primaryKey = this._getPrimaryKey(name);
        if (_has(this._byId, primaryKey)) {
            return this._byId[primaryKey];
        }

        return super.get(name);
    }

    getRoot() {
        var parent = this;
        while (true) {
            if (!parent.parent) {
                return parent;
            }
            parent = parent.parent;
        }
    }

    /**
     *
     * @param {function|Jii.data.Query} value
     */
    setFilter(value) {
        // @todo normalize code, remove duplicates

        var modelClass = this.modelClass && Jii.namespace(this.modelClass);
        var db = modelClass && modelClass.getDb && modelClass.getDb();
        var parentCollection = this.parent || this;

        // Function
        if (_isFunction(value) || value === null) {
            if (!this._filter || this._filter !== value) {
                // Unsubscribe previous
                if (db && this._filter && this._filter.query && this._filter.attributes) {
                    _each(this._filter.attributes, attribute => {
                        parentCollection.off(Collection.EVENT_CHANGE_NAME + attribute, {
                            context: this,
                            callback: this.refreshFilter
                        });
                    });
                }

                this._filter = value;
                this.refreshFilter();
            }
        }

        // Query instance
        // TODO Instance of without require deps
        if (_isObject(value) && _isFunction(value.createCommand) && _isFunction(value.prepare) && (!this._filter || this._filter.query !== value)) {
            if (db) {
                // Unsubscribe previous
                if (this._filter && this._filter.query && this._filter.attributes) {
                    _each(this._filter.attributes, attribute => {
                        parentCollection.off(Collection.EVENT_CHANGE_NAME + attribute, {
                            context: this,
                            callback: this.refreshFilter
                        });
                    });
                }
            }

            this._filter = this._normalizePredicate(value);

            if (db) {
                // Subscribe current
                _each(this._filter.attributes, attribute => {
                    parentCollection.on(Collection.EVENT_CHANGE_NAME + attribute, {
                        context: this,
                        callback: this.refreshFilter
                    });
                });
            }

            this.refreshFilter();
        }
    }

    /**
     * Run filter
     */
    refreshFilter() {
        var models = this._filterModels();

        var diff = this._prepareDiff(models);
        if (diff.add.length || diff.remove.length) {
            this._change(0, diff.add, diff.remove, true);
        }

        _each(this._childCollections, childCollection => {
            childCollection.refreshFilter();
        });
    }

    _filterModels() {
        var models = this.parent ? this.parent.getModels() : this.getModels();
        if (this._filter) {
            // Optimize search by id
            // @todo bad condition.. =(
            var where = this._filter.query ? this._filter.query.getWhere() : null;
            if (_isArray(where) && _isString(where[0]) && where[0].toLowerCase() === 'in' && where[1].toString() === Jii.namespace(this.modelClass).primaryKey().toString()) {
                models = _map(where[2], id => this._byId[id]);
            } else {
                models = _filter(models, this._filter);
            }
        }

        return models;
    }

    /**
     * @return {boolean}
     */
    isFetched() {
        return this._isFetched;
    }

    /**
     *
     * @param {object|Jii.data.CollectionAdapterInterface} collectionAdapter
     */
    createProxy(collectionAdapter) {
        var cloned = collectionAdapter.instance(this);

        // Fill
        collectionAdapter.add(this, cloned, this.getModels());

        // Subscribe
        this.on(Collection.EVENT_CHANGE, /** @param {Jii.data.CollectionEvent} event */
                                         event => {
            if (event.added.length > 0) {
                collectionAdapter.add(this, cloned, event.added);
            }
            if (event.removed.length > 0) {
                collectionAdapter.remove(this, cloned, event.removed);
            }
        });

        return cloned;
    }

    /**
     * Begin change operation
     */
    beginEdit() {
        this._editedLevel++;

        _each(this._childCollections, childCollection => {
            childCollection.beginEdit();
        });
    }

    /**
     * Cancel all changes after beginEdit() call
     */
    cancelEdit() {
        if (this._editedLevel > 0) {
            this._editedLevel--;
        }

        // Cancel in sub-models
        if (this._editedLevel === 0) {
            _each(this._childCollections, childCollection => {
                childCollection.cancelEdit();
            });

            // Revert changes
            // TODO

            // Reset state
            this._editedEvents = [];
        }
    }

    /**
     * End change operation - trigger change events
     */
    endEdit() {
        if (this._editedLevel > 0) {
            this._editedLevel--;
        }

        if (this._editedLevel === 0) {
            // End in child
            _each(this._childCollections, childCollection => {
                childCollection.endEdit();
            });

            // Each trigger events in children
            _each(this._editedEvents, /** @param {Jii.data.CollectionEvent} event */
                                      event => {
                if (event.added.length > 0) {
                    this.trigger(Collection.EVENT_ADD, event);
                }
                if (event.isFetch) {
                    this.trigger(Collection.EVENT_FETCHED, event);
                }
                if (event.removed.length > 0) {
                    this.trigger(Collection.EVENT_REMOVE, event);
                }
                if (event.added.length > 0 || event.removed.length > 0) {
                    this.trigger(Collection.EVENT_CHANGE, event);
                }

                if (event.isSorted) {
                    this._onSort();
                }
            });

            // Reset state
            this._editedEvents = [];
        }
    }

    /**
     *
     *
     * @param {number|string|object} primaryKey
     * @returns {*|null}
     */
    getById(primaryKey) {
        return this._byId[this._getPrimaryKey(primaryKey)] || null;
    }

    /**
     *
     * @returns {number}
     */
    getCount() {
        return this.length;
    }

    /**
     *
     * @returns {[]}
     */
    getKeys() {
        return this.map(this._getPrimaryKey.bind(this));
    }

    /**
     * @param options
     * @returns {*}
     */
    toJSON(options) {
        return this.map(model => model.toJSON(options));
    }

    /**
     *
     * @param {number} index
     * @returns {*}
     */
    at(index) {
        if (index < 0) {
            index = Math.max(0, this.length + index);
        }
        return this[index] || null;
    }

    /**
     *
     * @param {*} [models]
     */
    reset(models) {
        models = models || [];
        if (!_isArray(models)) {
            models = [models];
        }

        if (this.parent) {
            this.parent.reset(models);
        } else {
            var diff = this._prepareDiff(models);
            this._change(0, diff.add, diff.remove, true);
        }
    }

    _prepareDiff(models) {
        var toAdd = [];
        _each(models, data => {
            var finedModels = this._findModels(data);
            if (finedModels.length) {
                // Convert data to model
                _each(this._findModels(data), model => {
                    if (_indexOf(toAdd, model) === -1) {
                        toAdd.push(model);
                    }
                });
            } else {
                toAdd.push(data);
            }
        });

        var toRemove = [];
        _each(this.getModels(), model => {
            if (_indexOf(toAdd, model) === -1) {
                toRemove.push(model);
            }
        });

        return {
            add: toAdd,
            remove: toRemove
        };
    }

    /**
     *
     * @returns {static}
     */
    clone() {
        return new this.constructor(this.getModels(), {
            modelClass: this.modelClass
        });
    }

    /**
     *
     * @param {function|Jii.data.Query} [filter]
     * @param {object} [params]
     * @param {Jii.base.Collection} [className]
     * @returns {Jii.base.Collection}
     */
    createChild(filter, params, className) {
        filter = filter || null;
        params = params || {};
        className = className || this.constructor;

        var models = params.models || null;
        delete params.models;

        var childCollection = new className(null, _extend({}, params, {
            modelClass: this.modelClass,
            parent: this
        }));
        if (this._isFetched) {
            childCollection._change(0, this.getModels(), [], true);
        }

        this._childCollections.push(childCollection);
        if (models) {
            childCollection.setModels(models);
        }

        if (filter) {
            childCollection.setFilter(filter);
        }
        return childCollection;
    }

    /**
     *
     * @param {object} [params]
     * @param {Jii.data.DataProvider} [className]
     * @returns {Jii.base.Collection}
     */
    createDataProvider(params, className) {
        params = params || {};
        className = className || require('../data/DataProvider');
        return this.createChild(null, params, className);
    }

    /**
     *
     * @param name
     * @returns {{index: number, subName: string|null}}
     * @private
     */
    _detectKeyFormatIndex(name) {
        var matches = /^\[([0-9]+)\]\.?(.*)/.exec(name);
        if (matches === null) {
            return null;
        }

        return {
            index: parseInt(matches[1]),
            subName: matches[2] || null
        };
    }

    _change(startIndex, toAdd, toRemove, unique, byParent) {
        unique = unique || false;
        byParent = byParent || false;

        var isFirstUpdate = !this.isFetched();

        // Mark as fetched on any adds
        this._isFetched = true;

        var added = [];
        var removed = [];

        // Remove
        _each(toRemove, data => {
            _each(this._findModels(data), model => {
                var index = this.indexOf(model);
                if (index < startIndex) {
                    startIndex--;
                }

                if (this._remove(model, index)) {
                    removed.push(model);
                }
            });
        });

        // Add
        _each(toAdd, data => {
            var existsModels = unique ? this._findModels(data) : [];
            var models = existsModels.length > 0 ? existsModels : [this.createModel(data)];

            if (this._filter) {
                models = _filter(models, this._filter, this);
            }

            _each(models, model => {
                // Check moving
                if (existsModels.length > 0) {

                    // Update model attributes
                    const Model = require('../base/Model');
                    if (model instanceof Model && _isObject(data) && !(data instanceof Model)) {
                        model.set(data);
                    }
                } else if (this._add(model, startIndex)) {
                    added.push(model);
                    startIndex++;
                }
            });
        });

        // Lazy subscribe on added
        _each(added, model => {
            _each(this._eventsChangeName, arr => {
                model.on.apply(model, arr);
            });
        });

        // Unsubscribe on removed
        _each(removed, model => {
            _each(this._eventsChangeName, arr => {
                model.off.apply(model, arr.slice(0, 2));
            });
        });

        // Start
        this.beginEdit();

        // Trigger events
        this._editedEvents.push(this._createEvent({
            isFetch: isFirstUpdate,
            added: added,
            removed: removed
        }));

        // Change children
        _each(this._childCollections, childCollection => {
            childCollection._change(startIndex, added, removed, true, {
                startIndex: startIndex,
                toAdd: toAdd,
                toRemove: toRemove,
                unique: unique
            });
        });

        // End
        this.endEdit();

        return {
            added: added,
            removed: removed
        };
    }

    _add(model, index) {
        // Array access
        Array.prototype.splice.call(this, index++, 0, model);

        // By id
        const ActiveRecord = require('../data/BaseActiveRecord');
        if (model instanceof ActiveRecord) {
            this._byId[this._getPrimaryKey(model)] = model;
        }

        return true;
    }

    _remove(model, index) {
        // Array access
        Array.prototype.splice.call(this, index, 1);

        // By id
        const ActiveRecord = require('../data/BaseActiveRecord');
        if (model instanceof ActiveRecord) {
            delete this._byId[this._getPrimaryKey(model)];
        }

        return true;
    }

    /**
     *
     * @param {object} params
     * @returns {Jii.data.CollectionEvent}
     */
    _createEvent(params) {
        return new CollectionEvent(params);
    }

    /**
     *
     * @param {number|string|object} data
     * @returns {*|*[]}
     * @private
     */
    _findModels(data) {
        var primaryKey = this._getPrimaryKey(data);

        if (this.modelClass) {
            return this._byId[primaryKey] ? [this._byId[primaryKey]] : [];
        } else {
            return this.filter(model => primaryKey == this._getPrimaryKey(model));
        }
    }

    /**
     *
     * @param {number|string|object} data
     * @returns {string}
     */
    _getPrimaryKey(data) {
        const ActiveRecord = require('../data/BaseActiveRecord');
        if (_isObject(data) && this.modelClass && !(data instanceof ActiveRecord)) {
            let keys = this.modelClass.primaryKey();
            if (keys.length === 1) {
                data = data[keys[0]];
            } else {
                let obj = {};
                this.modelClass.primaryKey().forEach(attribute => {
                    obj[attribute] = _has(data, attribute) ? data[attribute] : null;
                });
                data = obj;
            }
        }

        if (data instanceof ActiveRecord) {
            data = data.getPrimaryKey();
        }

        if (_isObject(data)) {
            return JSON.stringify(data);
        }
        return data;
    }

    /**
     * Convert any data to model
     * @param {object|*} [data]
     * @returns {Jii.base.Model}
     */
    createModel(data) {
        // Already model
        const Model = require('../base/Model');
        if (data instanceof Model) {
            return data;
        }

        // Disabled model auto create
        if (this.modelClass === false) {
            return data;
        }

        // Required
        if (this.modelClass === null) {
            InvalidConfigException('Property `modelClass` in collection is required (or set false to force disable).');
        }

        // Empty model
        if (!data) {
            data = {};
        }

        if (_isObject(data)) {
            var modelClass = this.modelClass;
            modelClass = Jii.namespace(modelClass);
            if (!_isFunction(modelClass)) {
                throw new InvalidConfigException('Not found model class for create instance in collection, modelClass: ' + this.modelClass);
            }

            if (_isFunction(modelClass.instantiate) && _isFunction(modelClass.populateRecord)) {
                var model = modelClass.instantiate(data);
                modelClass.populateRecord(model, data);
                return model;
            }
            return new modelClass(data);
        }

        throw new InvalidParamException('Cannot create model instance from data: ' + JSON.stringify(data));
    }

    _onSort() {
    }

    /**
     * @param {string|string[]} name
     * @param {function|object} handler
     * @param {*} [data]
     * @param {boolean} [isAppend]
     */
    on(name, handler, data, isAppend) {
        // Multiple names support
        name = this._normalizeEventNames(name);
        if (name.length > 1) {
            _each(name, n => {
                this.on(n, handler, data, isAppend);
            });
            return;
        } else {
            name = name[0];
        }

        // Attributes in models
        var changeNameFormat = this._detectKeyFormatChangeName(name);
        if (changeNameFormat) {
            const Model = require('../base/Model');
            var changeNameEvent = Model.EVENT_CHANGE_NAME + changeNameFormat.subName;
            this._eventsChangeName.push([
                changeNameEvent,
                handler,
                data,
                isAppend
            ]);
            this.each(model => {
                model.on(changeNameEvent, handler, data, isAppend);
            });
            return;
        }

        super.on(name, handler, data, isAppend);
    }

    /**
     * @param {string|string[]} name
     * @param {function} [handler]
     * @return boolean
     */
    off(name, handler) {
        // Multiple names support
        name = this._normalizeEventNames(name);
        if (name.length > 1) {
            var bool = false;
            _each(name, n => {
                if (this.on(n, handler)) {
                    bool = true;
                }
            });
            return bool;
        } else {
            name = name[0];
        }

        // Attributes in models
        var changeNameFormat = this._detectKeyFormatChangeName(name);
        if (changeNameFormat) {
            const Model = require('../base/Model');
            var changeNameEvent = Model.EVENT_CHANGE_NAME + changeNameFormat.subName;
            this._eventsChangeName = _filter(this._eventsChangeName, arr => {
                return arr[0] !== changeNameEvent || arr[1] !== handler;
            });

            var bool = false;
            this.each(model => {
                if (model.off(changeNameEvent, handler)) {
                    bool = true;
                }
            });
            return bool;
        }

        return super.off(name, handler);
    }

    _detectKeyFormatChangeName(name) {
        if (name.indexOf(Collection.EVENT_CHANGE_NAME) !== 0) {
            return null;
        }

        return {
            subName: name.substr(Collection.EVENT_CHANGE_NAME.length)
        };
    }

    // Array prototype
    /////////////////////
    /**
     *
     * @param {...*} value1
     * @returns {self}
     */
    concat(value1) {
        this.add(_toArray(arguments));
        return this;
    }

    /**
     *
     */
    reverse() {
        Array.prototype.reverse.call(this);
        this._onSort();
    }

    /**
     *
     */
    sort() {
        Array.prototype.sort.call(this);
        this._onSort();
    }

    /**
     *
     */
    toArray() {
        return this;
    }

    /**
     *
     */
    join() {
        // @todo
        throw new NotSupportedException();
    }

    /**
     *
     */
    toString() {
        // @todo
        throw new NotSupportedException();
    }

    /**
     *
     */
    toLocaleString() {
        // @todo
        throw new NotSupportedException();
    }

    /**
     *
     *
     * @param {number} start
     * @param {number} deleteCount
     * @param {...object} [model1]
     * @returns {[]}
     */
    splice(start, deleteCount, model1) {
        var toRemove = Array.prototype.slice.call(this, start, start + deleteCount);
        this.remove(toRemove);
        this.add(_toArray(arguments).slice(2), start);
        return toRemove;
    }

    /**
     *
     * @param begin
     * @param end
     * @returns {*}
     */
    slice(begin, end) {
        return new this.constructor(Array.prototype.slice.call(this, begin, end), {
            modelClass: this.modelClass
        });
    }

    /**
     *
     * @param {...object} model
     */
    push(model) {
        this.add(_toArray(arguments));
    }

    /**
     *
     * @returns {object}
     */
    pop() {
        if (this.length === 0) {
            return null;
        }

        var model = this[this.length - 1];
        this.remove(model);
        return model;
    }

    /**
     *
     * @param {...object} model1
     * @returns {number}
     */
    unshift(model1) {
        this.add(_toArray(arguments), 0);
        return this.length;
    }

    /**
     *
     * @returns {object}
     */
    shift() {
        if (this.length === 0) {
            return null;
        }

        var model = this[0];
        this.remove(model);
        return model;
    }

    // @todo ES6 methods
    //es6 copyWithin: function() {},
    //es6 entries: function() {},
    //es6 fill: function() {},
    //es6 keys: function() {},
    //es6 values: function() {},
    // Underscore methods
    /////////////////////
    /**
     *
     * @param {function} iteratee
     */
    each(iteratee) {
        return _each(this, iteratee);
    }

    /**
     *
     * @param {function} iteratee
     */
    forEach(iteratee) {
        return this.each.apply(this, arguments);
    }

    /**
     *
     * @param {function} iteratee
     * @returns {[]}
     */
    map(iteratee) {
        return _map(this, iteratee);
    }

    /**
     *
     * @param {function} iteratee
     * @param {*} [memo]
     * @returns {[]}
     */
    reduce(iteratee, memo) {
        return _reduce(this, iteratee, memo);
    }

    /**
     *
     * @param {function} iteratee
     * @param {*} [memo]
     * @returns {[]}
     */
    reduceRight(iteratee, memo) {
        return _reduceRight(this, iteratee, memo);
    }

    /**
     *
     * @param {function} predicate
     * @returns {object|Jii.base.Model|null}
     */
    find(predicate) {
        return _find(this, this._normalizePredicate(predicate)) || null;
    }

    /**
     *
     * @param {function} predicate
     * @returns {[]}
     */
    filter(predicate) {
        return _filter(this, this._normalizePredicate(predicate));
    }

    /**
     *
     * @param {object} properties
     * @returns {[]}
     */
    where(properties) {
        return _filter(this, properties);
    }

    /**
     *
     * @param {object} properties
     * @returns {object|Jii.base.Model|null}
     */
    findWhere(properties) {
        return _find(this, properties) || null;
    }

    /**
     *
     * @param {function} predicate
     * @returns {[]}
     */
    reject(predicate) {
        return _reject(this, this._normalizePredicate(predicate));
    }

    /**
     *
     * @param {function} [predicate]
     */
    every(predicate) {
        return _every(this, this._normalizePredicate(predicate));
    }

    /**
     *
     * @param {function} [predicate]
     */
    some(predicate) {
        return _some(this, this._normalizePredicate(predicate));
    }

    /**
     *
     * @param {string} propertyName
     * @returns {Array}
     */
    pluck(propertyName) {
        return _map(this, model => _isFunction(model.get) ? model.get(propertyName) : model[propertyName]);
    }

    /**
     *
     * @param {function} [iteratee]
     * @returns {object}
     */
    max(iteratee) {
        return _maxBy(this, iteratee);
    }

    /**
     *
     * @param {function} [iteratee]
     * @returns {object}
     */
    min(iteratee) {
        return _minBy(this, iteratee);
    }

    /**
     *
     * @param {string|function} value
     * @returns {[]}
     */
    sortBy(value) {
        var iterator = _isFunction(value) ? value : model => _isFunction(model.get) ? model.get(value) : model[value];

        _each(_sortBy(this, iterator), (model, i) => {
            this[i] = model;
        });
        this._onSort();
    }

    /**
     *
     * @param {string|function} value
     * @returns {[]}
     */
    groupBy(value) {
        var iterator = _isFunction(value) ? value : model => _isFunction(model.get) ? model.get(value) : model[value];

        return _groupBy(this, iterator);
    }

    /**
     *
     * @param {string|function} value
     * @returns {[]}
     */
    /*indexBy(value) {
     var iterator = _isFunction(value) ?
     value :
     model => _isFunction(model.get) ? model.get(value) : model[value];

     return _indexBy(this, iterator);
     },*/
    /**
     *
     * @param {string|function} value
     * @returns {[]}
     */
    countBy(value) {
        var iterator = _isFunction(value) ? value : model => _isFunction(model.get) ? model.get(value) : model[value];

        return _countBy(this, iterator);
    }

    /**
     *
     * @returns {number}
     */
    size() {
        return this.length;
    }

    /**
     *
     * @param [num]
     * @returns {number}
     */
    first(num) {
        return _first(this, num);
    }

    /**
     *
     * @param [num]
     * @returns {[]}
     */
    initial(num) {
        return _initial(this, num);
    }

    /**
     *
     * @param [num]
     * @returns {number}
     */
    last(num) {
        return _last(this, num);
    }

    /**
     *
     * @param [index]
     * @returns {number}
     */
    rest(index) {
        return _drop(this, index);
    }

    /**
     *
     * @param {...*} [value]
     * @returns {[]}
     */
    without(value) {
        var args = _toArray(arguments);
        args.unshift(this);
        return _without.apply(null, args);
    }

    /**
     *
     * @param {*} [value]
     * @param {boolean} [isSorted]
     * @returns {number}
     */
    indexOf(value, isSorted) {
        return _indexOf(this, value, isSorted);
    }

    /**
     *
     * @param {*} value
     * @param {number} [fromIndex]
     * @returns {object}
     */
    lastIndexOf(value, fromIndex) {
        return _lastIndexOf(this, value, fromIndex);
    }

    /**
     *
     * @param {object} model
     * @param {*} value
     * @returns {number}
     */
    /*sortedIndex(model, value) {
     var iterator = _isFunction(value) ?
     value :
     model => _isFunction(model.get) ? model.get(value) : model[value];

     return _sortedIndex(this, model, iterator);
     },*/
    /**
     *
     * @param {function} predicate
     * @returns {number}
     */
    findIndex(predicate) {
        return _findIndex(this, this._normalizePredicate(predicate));
    }

    /**
     *
     * @param {function} predicate
     * @returns {number}
     */
    findLastIndex(predicate) {
        return _findLastIndex(this, this._normalizePredicate(predicate));
    }

    /**
     *
     */
    shuffle() {
        _shuffle(this);
    }

    /**
     *
     * @returns {boolean}
     */
    isEmpty() {
        return this.length === 0;
    }

    _normalizePredicate(predicate) {
        // TODO Instance of without require deps
        if (_isObject(predicate) && _isFunction(predicate.createCommand) && _isFunction(predicate.prepare) && this.modelClass) {
            var db = Jii.namespace(this.modelClass).getDb();
            if (db) {
                var filterBuilder = db.getSchema().getFilterBuilder();
                var query = predicate;
                filterBuilder.prepare(query);

                predicate = filterBuilder.createFilter(query);
                predicate.query = query;
                predicate.attributes = filterBuilder.attributes(query);
            } else {
                throw new InvalidConfigException('Not found db component in model.');
            }
        }

        return predicate;
    }

}

/**
 * @event Jii.base.Collection#remove
 * @property {Jii.data.CollectionEvent} event
 */
Collection.EVENT_REMOVE = 'remove';

/**
 * @event Jii.base.Collection#change:
 * @property {Jii.data.CollectionEvent} event
 */
Collection.EVENT_CHANGE_NAME = 'change:';

/**
 * @event Jii.base.Collection#change
 * @property {Jii.data.CollectionEvent} event
 */
Collection.EVENT_CHANGE = 'change';

/**
 * @event Jii.base.Collection#fetched
 * @property {Jii.data.CollectionEvent} event
 */
Collection.EVENT_FETCHED = 'fetched';

/**
 * @event Jii.base.Collection#add
 * @property {Jii.data.CollectionEvent} event
 */
Collection.EVENT_ADD = 'add';
module.exports = Collection;