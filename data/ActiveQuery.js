/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Query = require('./Query');
var Model = require('../base/Model');
var InvalidConfigException = require('../exceptions/InvalidConfigException');
var _isEmpty = require('lodash/isEmpty');
var _isString = require('lodash/isString');
var _isArray = require('lodash/isArray');
var _isUndefined = require('lodash/isUndefined');
var _isNull = require('lodash/isNull');
var _isNumber = require('lodash/isNumber');
var _indexOf = require('lodash/indexOf');
var _isObject = require('lodash/isObject');
var _toArray = require('lodash/toArray');
var _each = require('lodash/each');
var _clone = require('lodash/clone');
var _values = require('lodash/values');
var _has = require('lodash/has');
var _extend = require('lodash/extend');
var _keys = require('lodash/keys');
var _size = require('lodash/size');
var _uniq = require('lodash/uniq');

class ActiveQuery extends Query {

    preInit(modelClass, config) {
        config = config || {};

        /**
         * @type {boolean} whether to return each record as an array. If false (default), an object
         * of [[modelClass]] will be created to represent each record.
         */
        this._asArray = null;

        /**
         * @type {[]} a list of relations that this query should be performed with
         */
        this._with = null;

        /**
         * @type {string} the name of the relation that is the inverse of this relation.
         * For example, an order has a customer, which means the inverse of the "customer" relation
         * is the "orders", and the inverse of the "orders" relation is the "customer".
         * If this property is set, the primary record(s) will be referenced through the specified relation.
         * For example, `customer.orders[0].customer` and `customer` will be the same object,
         * and accessing the customer of an order will not trigger new DB() query.
         * This property is only used in relational context.
         * @see inverseOf()
         */
        this._inverseOf = null;

        /**
         * @type {[]|object} the query associated with the junction table. Please call [[via()]]
         * to set this property instead of directly setting it.
         * This property is only used in relational context.
         * @see via()
         */
        this._via = null;

        /**
         * @type {object} the columns of the primary and foreign tables that establish a relation.
         * The array keys must be columns of the table for this relation, and the array values
         * must be the corresponding columns from the primary table.
         * Do not prefix or quote the column names as this will be done automatically by Jii.
         * This property is only used in relational context.
         */
        this.link = null;

        /**
         * @type {[]} a list of relations that this query should be joined with
         */
        this._joinWith = [];

        /**
         * @type {string} the SQL statement to be executed for retrieving AR records.
         * This is set by [[ActiveRecord.findBySql()]].
         */
        this._sql = null;

        /**
         * @type {string|[]} the join condition to be used when this query is used in a relational context.
         * The condition will be used in the ON part when [[ActiveQuery.joinWith()]] is called.
         * Otherwise, the condition will be used in the WHERE part of a query.
         * Please refer to [[Query.where()]] on how to specify this parameter.
         * @see onCondition()
         */
        this._on = null;

        /**
         * @type {ActiveRecord} the primary model of a relational query.
         * This is used only in lazy loading with dynamic query options.
         */
        this.primaryModel = null;

        /**
         * @type {boolean} whether this query represents a relation to more than one record.
         * This property is only used in relational context. If true, this relation will
         * populate all query results into AR instances using [[Query.all()|all()]].
         * If false, only the first row of the results will be retrieved using [[Query.one()|one()]].
         */
        this.multiple = null;

        /**
         * @type {ActiveRecord} ActiveRecord class.
         */
        this.modelClass = modelClass;

        super.preInit(config);
    }

    /**
     * Initializes the object.
     * This method is called at the end of the constructor. The default implementation will trigger
     * an [[EVENT_INIT]] event. If you override this method, make sure you call the parent implementation at the end
     * to ensure triggering of the event.
     */
    init() {
        super.init();
        this.trigger(ActiveQuery.EVENT_INIT);
    }

    setSql(sql) {
        this._sql = sql;
    }

    getSql() {
        return this._sql;
    }

    setOn(on) {
        this._on = on;
    }

    getOn() {
        return this._on;
    }

    /**
     * Executes query and returns all results as an array.
     * @param {Jii.sql.Connection} [db] the DB connection used to create the DB command.
     * If null, the DB connection returned by [[modelClass]] will be used.
     * @returns {[]|ActiveRecord[]} the query results. If the query results in nothing, an empty array will be returned.
     */
    all(db) {
        db = db || null;

        return super.all(db);
    }

    /**
     * @inheritdoc
     */
    prepare(builder) {
        // NOTE: because the same ActiveQuery may be used to build different SQL statements
        // (e.g. by DataProvider, one for count query, the other for row data query,
        // it is important to make sure the same ActiveQuery can be used to build SQL statements
        // multiple times.
        if (!_isEmpty(this._joinWith)) {
            this._buildJoinWith();
            this._joinWith = []; // clean it up to avoid issue https://github.com/jiisoft/jii2/issues/2687
        }

        if (_isEmpty(this._from)) {
            /** @typedef {ActiveRecord} modelClass */
            var modelClass = this.modelClass;
            var tableName = modelClass.tableName();
            this._from = [tableName];
        }

        if (_isEmpty(this._select) && !_isEmpty(this._join)) {
            var isBreak = false;
            _each(this._from, (table, alias) => {
                if (isBreak) {
                    return;
                }

                if (_isString(alias)) {
                    this._select = [alias + '.*'];
                } else if (_isString(table)) {
                    var matches = /^(.*?)\s+({{\w+}}|\w+)/.exec(table);
                    if (matches) {
                        alias = matches[2];
                    } else {
                        alias = table;
                    }
                    this._select = [alias + '.*'];
                }
                isBreak = true;
            });
        }

        return Promise.resolve().then(() => {
            if (this.primaryModel === null) {
                // eager loading
                return Query.createFromQuery(this);
            }

            // lazy loading of a relation
            var where = _clone(this._where);

            return Promise.resolve().then(() => {
                if (this._via instanceof ActiveQuery) {
                    // via junction table
                    return this._via._findJunctionRows([this.primaryModel]).then(viaModels => {
                        this._filterByModels(viaModels);
                    });
                }

                if (!_isArray(this._via)) {
                    this._filterByModels([this.primaryModel]);
                    return;
                }

                // via relation
                /** @typedef {Jii.data.ActiveQuery} viaQuery */
                var viaName = this._via[0];
                var viaQuery = this._via[1];

                if (viaQuery.multiple) {
                    return viaQuery.all().then(viaModels => {
                        this.primaryModel.populateRelation(viaName, viaModels);
                        this._filterByModels(viaModels);
                    });
                }

                return viaQuery.one().then(model => {
                    this.primaryModel.populateRelation(viaName, model);
                    this._filterByModels(model === null ? [] : [model]);
                });
            }).then(() => {
                var query = Query.createFromQuery(this);
                this._where = where;
                return query;
            });
        }).then(query => {
            if (!_isEmpty(this._on)) {
                query.andWhere(this._on);
            }

            return query;
        });
    }

    /**
     * @inheritdoc
     */
    populate(rows) {
        if (_isEmpty(rows)) {
            return [];
        }

        var models = this._createModels(rows);

        if (!_isEmpty(this._join) && this._indexBy === null) {
            models = this._removeDuplicatedModels(models);
        }

        return Promise.resolve().then(() => {
            if (!_isEmpty(this._with)) {
                return this.findWith(this._with, models);
            }
        }).then(() => {
            if (!this._asArray) {
                _each(models, model => {
                    model.afterFind();
                });
            }

            return models;
        });
    }

    /**
     * Removes duplicated models by checking their primary key values.
     * This method is mainly called when a join query is performed, which may cause duplicated rows being returned.
     * @param {[]} models the models to be checked
     * @returns {[]} the distinctive models
     */
    _removeDuplicatedModels(models) {
        var hash = {};
        var newModels = {};

        /** @typedef {ActiveRecord} _class */
        var _class = this.modelClass;
        var pks = _class.primaryKey();

        if (pks.length > 1) {
            _each(models, (model, i) => {
                var key = [];
                _.each(pks, pk => {
                    key.push(model.get(pk));
                });
                key = JSON.stringify(key);

                if (!hash[key]) {
                    hash[key] = true;
                    newModels[i] = model;
                }
            });
        } else {
            var pk = _values(pks)[0];
            _each(models, (model, i) => {
                var key = model.get(pk);

                if (!hash[key]) {
                    hash[key] = true;
                    newModels[i] = model;
                }
            });
        }

        return _values(newModels);
    }

    /**
     * Executes query and returns a single row of result.
     * @param {Jii.sql.Connection} [db] the DB connection used to create the DB command.
     * If null, the DB connection returned by [[modelClass]] will be used.
     * @returns {ActiveRecord|[]|null} a single row of query result. Depending on the setting of [[asArray]],
     * the query result may be either an array or an ActiveRecord object. Null will be returned
     * if the query results in nothing.
     */
    one(db) {
        db = db || null;

        return super.one(db).then(row => {
            if (row) {
                return this.populate([row]).then(models => {
                    return _values(models)[0] || null;
                });
            }

            return null;
        });
    }

    /**
     * Creates a DB command that can be used to execute this query.
     * @param {Jii.sql.Connection} db the DB connection used to create the DB command.
     * If null, the DB connection returned by [[modelClass]] will be used.
     * @returns {Jii.data.Command} the created DB command instance.
     */
    createCommand(db) {
        db = db || null;

        /** @typedef {ActiveRecord} modelClass */
        var modelClass = this.modelClass;
        if (db === null) {
            db = modelClass.getDb();
        }

        return Promise.resolve().then(() => {
            if (this._sql === null) {
                return db.getQueryBuilder().build(this);
            }

            return [
                this._sql,
                this._params
            ];
        }).then(buildParams => {
            var sql = buildParams[0];
            var params = buildParams[1];

            return db.createCommand(sql, params);
        });
    }

    /**
     * Joins with the specified relations.
     *
     * This method allows you to reuse existing relation definitions to perform JOIN queries.
     * Based on the definition of the specified relation(s), the method will append one or multiple
     * JOIN statements to the current query.
     *
     * If the `eagerLoading` parameter is true, the method will also eager loading the specified relations,
     * which is equivalent to calling [[with()]] using the specified relations.
     *
     * Note that because a JOIN query will be performed, you are responsible to disambiguate column names.
     *
     * This method differs from [[with()]] in that it will build up and execute a JOIN SQL statement
     * for the primary table. And when `eagerLoading` is true, it will call [[with()]] in addition with the specified relations.
     *
     * @param {[]|object} _with the relations to be joined. Each array element represents a single relation.
     * The array keys are relation names, and the array values are the corresponding anonymous functions that
     * can be used to modify the relation queries on-the-fly. If a relation query does not need modification,
     * you may use the relation name as the array value. Sub-relations can also be specified (see [[with()]]).
     * For example,
     *
     * ```js
     * // find all orders that contain books, and eager loading "books"
     * Order.find().joinWith('books', true, 'INNER JOIN').all();
     * // find all orders, eager loading "books", and sort the orders and books by the book names.
     * Order.find().joinWith({
     *     books: function (query) {
     *         query.orderBy('item.name');
     *     }
     * }).all();
     * ```
     *
     * @param {boolean|[]} eagerLoading whether to eager load the relations specified in `with`.
     * When this is a boolean, it applies to all relations specified in `with`. Use an array
     * to explicitly list which relations in `with` need to be eagerly loaded.
     * @param {string|[]} joinType the join type of the relations specified in `with`.
     * When this is a string, it applies to all relations specified in `with`. Use an array
     * in the format of `relationName => joinType` to specify different join types for different relations.
     * @returns {Jii.data.ActiveQuery} the query object itself
     */
    joinWith(_with, eagerLoading, joinType) {
        eagerLoading = _isUndefined(eagerLoading) || _isNull(eagerLoading) ? true : eagerLoading;
        joinType = joinType || 'LEFT JOIN';

        if (_isString(_with)) {
            _with = [_with];
        }
        this._joinWith.push([
            _with,
            eagerLoading,
            joinType
        ]);

        return this;
    }

    setJoinWith(joinWith) {
        this._joinWith = joinWith;
    }

    getJoinWith() {
        return this._joinWith;
    }

    _buildJoinWith() {
        var join = _clone(this._join);
        this._join = [];

        _each(this._joinWith, config => {
            var _with = _clone(config[0]);
            var eagerLoading = config[1];
            var joinType = config[2];
            this._joinWithRelations(new this.modelClass(), _with, joinType);

            if (_isArray(eagerLoading)) {
                _each(_with, (callback, name) => {
                    if (_isNumber(name)) {
                        if (_indexOf(eagerLoading, callback) !== -1) {
                            delete _with[name];
                        }
                    } else if (_indexOf(eagerLoading, name) !== -1) {
                        delete _with[name];
                    }
                });
            } else if (!eagerLoading) {
                _with = [];
            }

            this.with(_with);
        });

        // remove duplicated joins added by joinWithRelations that may be added
        // e.g. when joining a relation and a via relation at the same time
        var uniqueJoins = {};
        _each(this._join, j => {
            uniqueJoins[JSON.stringify(j)] = j;
        });
        this._join = _values(uniqueJoins);

        if (!_isEmpty(join)) {
            // append explicit join to joinWith()
            // https://github.com/jiisoft/jii2/issues/2880
            this._join = this._join.concat(join);
        }
    }

    /**
     * Inner joins with the specified relations.
     * This is a shortcut method to [[joinWith()]] with the join type set as "INNER JOIN".
     * Please refer to [[joinWith()]] for detailed usage of this method.
     * @param {[]} _with the relations to be joined with
     * @param {boolean|[]} eagerLoading whether to eager loading the relations
     * @returns {Jii.data.ActiveQuery} the query object itself
     * @see joinWith()
     */
    innerJoinWith(_with, eagerLoading) {
        eagerLoading = _isUndefined(eagerLoading) || _isNull(eagerLoading) ? true : eagerLoading;

        return this.joinWith(_with, eagerLoading, 'INNER JOIN');
    }

    /**
     * Modifies the current query by adding join fragments based on the given relations.
     * @param {ActiveRecord} model the primary model
     * @param {[]} _with the relations to be joined
     * @param {string|[]} joinType the join type
     */
    _joinWithRelations(model, _with, joinType) {
        var relations = {};
        var relation;

        _each(_with, (callback, name) => {
            if (_isNumber(name)) {
                name = callback;
                callback = null;
            }

            var primaryModel = model;
            var parent = this;
            var prefix = '';
            var pos;
            while (true) {
                pos = name.indexOf('.');
                if (pos === -1) {
                    break;
                }

                var childName = name.substr(pos + 1);

                name = name.substr(0, pos);
                var fullName = prefix === '' ? name : prefix + '.' + name;
                if (!_has(relations, fullName)) {
                    relations[fullName] = relation = primaryModel.getRelation(name);
                    this._joinWithRelation(parent, relation, this._getJoinType(joinType, fullName));
                } else {
                    relation = relations[fullName];
                }
                primaryModel = new relation.modelClass();
                parent = relation;
                prefix = fullName;
                name = childName;
            }

            fullName = prefix === '' ? name : prefix + '.' + name;
            if (!_has(relations, fullName)) {
                relations[fullName] = relation = primaryModel.getRelation(name);
                if (callback !== null) {
                    callback.call(null, relation);
                }
                if (!_isEmpty(relation.getJoinWith())) {
                    relation._buildJoinWith();
                }
                this._joinWithRelation(parent, relation, this._getJoinType(joinType, fullName));
            }
        });
    }

    /**
     * Returns the join type based on the given join type parameter and the relation name.
     * @param {string|[]} joinType the given join type(s)
     * @param {string} name relation name
     * @returns {string} the real join type
     */
    _getJoinType(joinType, name) {
        if (_isObject(joinType) && _has(joinType, name)) {
            return joinType[name];
        } else {
            return _isString(joinType) ? joinType : 'INNER JOIN';
        }
    }

    /**
     * Returns the table name and the table alias for [[modelClass]].
     * @param {Jii.data.ActiveQuery} query
     * @returns {[]} the table name and the table alias.
     */
    _getQueryTableName(query) {
        var tableName = '';

        if (_isEmpty(query.getFrom())) {
            /** @typedef ActiveRecord modelClass */
            var modelClass = query.modelClass;
            tableName = modelClass.tableName();
        } else {
            var _from = query.getFrom();
            var isBreak = false;
            var queryTableName = null;
            _each(_from, (tn, alias) => {
                if (isBreak) {
                    return;
                }

                tableName = tn;
                if (_isString(alias)) {
                    queryTableName = [
                        tableName,
                        alias
                    ];
                }
                isBreak = true;
            });
            if (queryTableName) {
                return queryTableName;
            }
        }

        var matches = /^(.*?)\s+({{\w+}}|\w+)/.exec(tableName);
        var aliasMatch = matches !== null ? matches[2] : tableName;

        return [
            tableName,
            aliasMatch
        ];
    }

    /**
     * Joins a parent query with a child query.
     * The current query object will be modified accordingly.
     * @param {Jii.data.ActiveQuery} parent
     * @param {Jii.data.ActiveQuery} child
     * @param {string} joinType
     */
    _joinWithRelation(parent, child, joinType) {
        var via = child.getVia();
        child.setVia(null);

        if (via instanceof ActiveQuery) {
            // via table
            this._joinWithRelation(parent, via, joinType);
            this._joinWithRelation(via, child, joinType);
            return;
        } else if (_isArray(via)) {
            // via relation
            this._joinWithRelation(parent, via[1], joinType);
            this._joinWithRelation(via[1], child, joinType);
            return;
        }

        var parentQueryTableName = this._getQueryTableName(parent);
        var parentAlias = parentQueryTableName[1];

        var childQueryTableName = this._getQueryTableName(child);
        var childTable = childQueryTableName[0];
        var childAlias = childQueryTableName[1];

        if (!_isEmpty(child.link)) {

            if (parentAlias.indexOf('{{') === -1) {
                parentAlias = '{{' + parentAlias + '}}';
            }
            if (childAlias.indexOf('{{') === -1) {
                childAlias = '{{' + childAlias + '}}';
            }

            var on = [];
            _each(child.link, (parentColumn, childColumn) => {
                on.push(parentAlias + '.[[' + parentColumn + ']] = ' + childAlias + '.[[' + childColumn + ']]');
            });
            on = on.join(' AND ');
            if (!_isEmpty(child.getOn())) {
                on = [
                    'and',
                    on,
                    child.getOn()
                ];
            }
        } else {
            on = child.getOn();
        }
        this.join(joinType, _isEmpty(child.getFrom()) ? childTable : child.getFrom(), on);

        if (!_isEmpty(child.getWhere())) {
            this.andWhere(child.getWhere());
        }
        if (!_isEmpty(child.getHaving())) {
            this.andHaving(child.getHaving());
        }
        if (!_isEmpty(child.getOrderBy())) {
            this.addOrderBy(child.getOrderBy());
        }
        if (!_isEmpty(child.getGroupBy())) {
            this.addGroupBy(child.getGroupBy());
        }
        if (!_isEmpty(child.getParams())) {
            this.addParams(child.getParams());
        }
        if (!_isEmpty(child.getJoin())) {
            _each(child.getJoin(), join => {
                this._join.push(join);
            });
        }
        if (!_isEmpty(child.getUnion())) {
            _each(child.getUnion(), union => {
                this._union.push(union);
            });
        }
    }

    /**
     * Sets the ON condition for a relational query.
     * The condition will be used in the ON part when [[ActiveQuery.joinWith()]] is called.
     * Otherwise, the condition will be used in the WHERE part of a query.
     *
     * Use this method to specify additional conditions when declaring a relation in the [[ActiveRecord]] class:
     *
     * ```js
     * public function getActiveUsers()
     * {
     *     return this.hasMany(User, {id: 'user_id'}).onCondition({active: true});
     * }
     * ```
     *
     * @param {string|[]} condition the ON condition. Please refer to [[Query.where()]] on how to specify this parameter.
     * @param {[]} params the parameters (name => value) to be bound to the query.
     * @returns {Jii.data.ActiveQuery} the query object itself
     */
    onCondition(condition, params) {
        params = params || {};

        this._on = condition;
        this.addParams(params);
        return this;
    }

    /**
     * Adds an additional ON condition to the existing one.
     * The new condition() and the existing one will be joined using the 'AND' operator.
     * @param {string|[]} condition the new ON() condition. Please refer to [[where()]]
     * on how to specify this parameter.
     * @param {[]} params the parameters (name => value) to be bound to the query.
     * @returns {Jii.data.ActiveQuery} the query object itself
     * @see onCondition()
     * @see orOnCondition()
     */
    andOnCondition(condition, params) {
        params = params || [];

        if (this._on === null) {
            this._on = condition;
        } else {
            this._on = [
                'and',
                this._on,
                condition
            ];
        }
        this.addParams(params);
        return this;
    }

    /**
     * Adds an additional ON condition to the existing one.
     * The new condition() and the existing one will be joined using the 'OR' operator.
     * @param {string|[]} condition the new ON() condition. Please refer to [[where()]]
     * on how to specify this parameter.
     * @param {[]} params the parameters (name => value) to be bound to the query.
     * @returns {Jii.data.ActiveQuery} the query object itself
     * @see onCondition()
     * @see andOnCondition()
     */
    orOnCondition(condition, params) {
        params = params || [];

        if (this._on === null) {
            this._on = condition;
        } else {
            this._on = [
                'or',
                this._on,
                condition
            ];
        }
        this.addParams(params);
        return this;
    }

    /**
     * Specifies the junction table for a relational query.
     *
     * Use this method to specify a junction table when declaring a relation in the [[ActiveRecord]] class:
     *
     * ```js
     * public function getItems()
     * {
     *     return this.hasMany(Item, {id: 'item_id'})
     *                 .viaTable('order_item', {order_id: 'id'});
     * }
     * ```
     *
     * @param {string} tableName the name of the junction table.
     * @param {[]} link the link between the junction table and the table associated with [[primaryModel]].
     * The keys of the array represent the columns in the junction table, and the values represent the columns
     * in the [[primaryModel]] table.
     * @param {function} callable a PHP callback for customizing the relation associated with the junction table.
     * Its signature should be `function(query)`, where `query` is the query to be customized.
     * @returns {Jii.data.ActiveQuery}
     * @see via()
     */
    viaTable(tableName, link, callable) {
        callable = callable || null;

        var relation = new this.constructor(this.primaryModel, {
            from: [tableName],
            link: link,
            multiple: true,
            asArray: true
        });
        this._via = relation;
        if (callable !== null) {
            callable.call(null, relation);
        }

        return this;
    }

    /**
     * Specifies the relation associated with the junction table.
     *
     * Use this method to specify a pivot record/table when declaring a relation in the [[ActiveRecord]] class:
     *
     * ```js
     * public function getOrders()
     * {
     *     return this.hasOne(Order, {id: 'order_id'});
     * }
     *
     * public function getOrderItems()
     * {
     *     return this.hasMany(Item, {id: 'item_id'})
     *                 .via('orders');
     * }
     * ```
     *
     * @param {string} relationName the relation name. This refers to a relation declared in [[primaryModel]].
     * @param {function} [callable] a PHP callback for customizing the relation associated with the junction table.
     * Its signature should be `function(query)`, where `query` is the query to be customized.
     * @returns {Jii.data.ActiveQuery} the relation object itself.
     */
    via(relationName, callable) {
        callable = callable || null;

        var relation = this.primaryModel.getRelation(relationName);
        this._via = [
            relationName,
            relation
        ];
        if (callable !== null) {
            callable.call(null, relation);
        }
        return this;
    }

    getVia() {
        return this._via;
    }

    setVia(via) {
        this._via = via;
    }

    /**
     * Sets the name of the relation that is the inverse of this relation.
     * For example, an order has a customer, which means the inverse of the "customer" relation
     * is the "orders", and the inverse of the "orders" relation is the "customer".
     * If this property is set, the primary record(s) will be referenced through the specified relation.
     * For example, `customer.orders[0].customer` and `customer` will be the same object,
     * and accessing the customer of an order will not trigger a new DB() query.
     *
     * Use this method when declaring a relation in the [[ActiveRecord]] class:
     *
     * ```js
     * public function getOrders()
     * {
     *     return this.hasMany(Order, {customer_id: 'id'}).inverseOf('customer');
     * }
     * ```
     *
     * @param {string} relationName the name of the relation that is the inverse of this relation.
     * @returns {Jii.data.ActiveQuery} the relation object itself.
     */
    inverseOf(relationName) {
        this._inverseOf = relationName;
        return this;
    }

    /**
     *
     * @returns {Jii.data.ActiveQuery} the query object itself
     */
    setInverseOf(inverseOf) {
        this._inverseOf = inverseOf;
    }

    /**
     *
     * @returns {string}
     */
    getInverseOf() {
        return this._inverseOf;
    }

    /**
     * Finds the related records for the specified primary record.
     * This method is invoked when a relation of an ActiveRecord is being accessed in a lazy fashion.
     * @param {string} name the relation name
     * @param {Jii.data.BaseActiveRecord} model the primary model
     * @returns {*} the related record(s)
     * @throws InvalidParamException if the relation is invalid
     */
    findFor(name, model) {

        return (this.multiple ? this.all() : this.one()).then(related => {

            if (this._inverseOf === null || _isEmpty(related)) {
                return related;
            }

            var ActiveRecord = require('./BaseActiveRecord');
            var inverseRelation = new this.modelClass().getRelation(this._inverseOf);

            if (this.multiple) {
                _each(related, (relatedModel, i) => {
                    if (relatedModel instanceof ActiveRecord) {
                        relatedModel.populateRelation(this._inverseOf, inverseRelation.multiple ? [model] : model);
                    } else {
                        related[i][this._inverseOf] = inverseRelation.multiple ? [model] : model;
                    }
                });
            } else {
                if (related instanceof ActiveRecord) {
                    related.populateRelation(this._inverseOf, inverseRelation.multiple ? [model] : model);
                } else {
                    related[this._inverseOf] = inverseRelation.multiple ? [model] : model;
                }
            }

            return related;
        });
    }

    /**
     * Finds the related records and populates them into the primary models.
     * @param {string} name the relation name
     * @param {[]} primaryModels primary models
     * @returns {[]} the related models
     * @throws InvalidConfigException if [[link]] is invalid
     */
    populateRelation(name, primaryModels) {
        if (!_isObject(this.link)) {
            throw new InvalidConfigException('Invalid link: it must be an array of key-value pairs.');
        }

        /** @typedef {Jii.data.ActiveQuery} viaQuery */
        var viaQuery = null;

        return Promise.resolve().then(() => {
            if (this._via instanceof ActiveQuery) {
                viaQuery = this._via;

                // via junction table
                return this._via._findJunctionRows(primaryModels);
            }

            if (!_isArray(this._via)) {
                return primaryModels;
            }

            // via relation
            var viaName = this._via[0];
            viaQuery = this._via[1];

            if (viaQuery.getAsArray() === null) {
                // inherit asArray from primary query
                viaQuery.setAsArray(this._asArray);
            }

            viaQuery.primaryModel = null;
            return viaQuery.populateRelation(viaName, primaryModels);
        }).then(viaModels => {
            this._filterByModels(viaModels);

            if (primaryModels.length === 1 && !this.multiple) {
                return this.one().then(model => {

                    var ActiveRecord = require('./BaseActiveRecord');
                    _each(primaryModels, (primaryModel, i) => {
                        if (primaryModel instanceof ActiveRecord) {
                            primaryModel.populateRelation(name, model);
                        } else {
                            primaryModels[i][name] = model;
                        }
                        if (this._inverseOf !== null) {
                            this._populateInverseRelation(primaryModels, [model], name, this._inverseOf);
                        }
                    });

                    return [model];
                });
            }

            // https://github.com/jiisoft/jii2/issues/3197
            // delay indexing related models after buckets are built
            var indexBy = this._indexBy;
            this._indexBy = null;

            return this.all().then(models => {
                var buckets = viaModels && viaQuery ? this._buildBuckets(models, this.link, viaModels, viaQuery.link) : this._buildBuckets(models, this.link);

                this._indexBy = indexBy;
                if (this._indexBy !== null && this.multiple) {
                    buckets = this._indexBuckets(buckets, this._indexBy);
                }

                var link = _values(viaQuery ? viaQuery.link : this.link);
                _each(primaryModels, (primaryModel, i) => {
                    var value = null;
                    var k = _values(link)[0];
                    var keys = primaryModel instanceof Model ? primaryModel.get(k) : primaryModel[k];

                    if (this.multiple && _isArray(keys) && link.length == 1) {

                        _each(keys, key => {
                            if (!_isNumber(key) && !_isString(key)) {
                                key = JSON.stringify(key);
                            }
                            if (_has(buckets, key)) {
                                if (this._indexBy !== null) {
                                    // if indexBy is set, array_merge will cause renumbering of numeric array

                                    value = value || {};
                                    _extend(value, buckets);
                                } else {
                                    value = value || [];
                                    value = value.concat(buckets[key]);
                                }
                            }
                        });
                    } else {
                        var key = this._getModelKey(primaryModel, link);
                        value = buckets[key] || (this.multiple ? [] : null);
                    }

                    var ActiveRecord = require('./BaseActiveRecord');
                    if (primaryModel instanceof ActiveRecord) {
                        primaryModel.populateRelation(name, value);
                    } else {
                        primaryModels[i][name] = value;
                    }
                });

                if (this._inverseOf !== null) {
                    this._populateInverseRelation(primaryModels, models, name, this._inverseOf);
                }

                return models;
            });
        });
    }

    /**
     * @param {ActiveRecord[]} primaryModels primary models
     * @param {ActiveRecord[]} models models
     * @param {string} primaryName the primary relation name
     * @param {string} name the relation name
     */
    _populateInverseRelation(primaryModels, models, primaryName, name) {
        if (_isEmpty(models) || _isEmpty(primaryModels)) {
            return;
        }

        var model = models[0];
        var ActiveRecord = require('./BaseActiveRecord');

        /** @typedef {Jii.data.ActiveQuery} relation */
        var relation = model instanceof ActiveRecord ? model.getRelation(name) : new this.modelClass().getRelation(name);

        if (relation.multiple) {
            var buckets = this._buildBuckets(primaryModels, relation.link, null, null, false);
            if (model instanceof ActiveRecord) {
                _each(models, model => {
                    var key = this._getModelKey(model, relation.link);
                    model.populateRelation(name, buckets[key] || []);
                });
            } else {
                _each(primaryModels, (primaryModel, i) => {
                    if (this.multiple) {
                        _each(primaryModel, (m, j) => {
                            var key = this._getModelKey(m, relation.link);
                            primaryModels[i][j][name] = buckets[key] || [];
                        });
                    } else if (!_isEmpty(primaryModel[primaryName])) {
                        var key = this._getModelKey(primaryModel[primaryName], relation.link);
                        primaryModels[i][primaryName][name] = buckets[key] || [];
                    }
                });
            }
        } else {
            if (this.multiple) {
                _each(primaryModels, (primaryModel, i) => {
                    var model = primaryModel instanceof Model ? primaryModel.get(primaryName) : primaryModel[primaryName];
                    _each(model, (m, j) => {
                        if (m instanceof ActiveRecord) {
                            m.populateRelation(name, primaryModel);
                        } else {
                            model[j][name] = primaryModel;
                        }
                    });
                });
            } else {
                _each(primaryModels, (primaryModel, i) => {
                    if (primaryModels[i][primaryName] instanceof ActiveRecord) {
                        primaryModels[i][primaryName].populateRelation(name, primaryModel);
                    } else if (!_isEmpty(primaryModels[i][primaryName])) {
                        primaryModels[i][primaryName][name] = primaryModel;
                    }
                });
            }
        }
    }

    /**
     * @param {[]} models
     * @param {[]} link
     * @param {[]} [viaModels]
     * @param {[]} [viaLink]
     * @param {boolean} [checkMultiple]
     * @returns {object}
     */
    _buildBuckets(models, link, viaModels, viaLink, checkMultiple) {
        viaModels = viaModels || null;
        viaLink = viaLink || null;
        checkMultiple = checkMultiple !== false;

        if (viaModels !== null) {
            var map = {};
            var viaLinkKeys = _keys(viaLink);
            var linkValues = _values(link);
            _each(viaModels, viaModel => {
                var key1 = this._getModelKey(viaModel, viaLinkKeys);
                var key2 = this._getModelKey(viaModel, linkValues);

                map[key2] = map[key2] || {};
                map[key2][key1] = true;
            });
        }

        var buckets = {};
        var linkKeys = _keys(link);

        if (map) {
            _each(models, (model, i) => {
                var key = this._getModelKey(model, linkKeys);
                if (_has(map, key)) {
                    _each(map[key], (v, k) => {
                        buckets[k] = buckets[k] || [];
                        buckets[k].push(model);
                    });
                }
            });
        } else {
            _each(models, (model, i) => {
                var key = this._getModelKey(model, linkKeys);
                buckets[key] = buckets[key] || [];
                buckets[key].push(model);
            });
        }

        if (checkMultiple && !this.multiple) {
            _each(buckets, (bucket, i) => {
                buckets[i] = bucket[0];
            });
        }

        return buckets;
    }

    /**
     * Indexes buckets by column name.
     *
     * @param {object} buckets
     * @param {string|function} indexBy the name of the column by which the query results should be indexed by.
     * This can also be a callable (e.g. anonymous function) that returns the index value based on the given row data.
     * @returns {object}
     */
    _indexBuckets(buckets, indexBy) {
        var result = {};
        _each(buckets, (models, key) => {
            result[key] = {};
            _each(models, model => {
                var index = _isString(indexBy) ? model.get(indexBy) : indexBy.call(null, model);
                result[key][index] = model;
            });
        });
        return result;
    }

    /**
     * @param {object} attributes the attributes to prefix
     * @returns {object}
     */
    _prefixKeyColumns(attributes) {
        if (!_isEmpty(this._join) || !_isEmpty(this._joinWith)) {
            var alias = null;

            if (_isEmpty(this._from)) {
                /** @typedef {ActiveRecord} modelClass */
                var modelClass = this.modelClass;
                alias = modelClass.tableName();
            } else {
                var isBreak = false;
                _each(this._from, (t, a) => {
                    if (isBreak) {
                        return;
                    }

                    if (!_isString(a)) {
                        alias = t;
                    }
                    isBreak = true;
                });
            }

            if (alias !== null) {
                _each(attributes, (attribute, i) => {
                    attributes[i] = alias + '.' + attribute;
                });
            }
        }
        return attributes;
    }

    /**
     * @param {[]} models
     */
    _filterByModels(models) {
        var attributes = _keys(this.link);

        attributes = this._prefixKeyColumns(attributes);

        var values = [];
        if (_size(attributes) === 1) {
            // single key
            var attribute = _values(this.link)[0];
            _each(models, model => {
                var value = model instanceof Model ? model.get(attribute) : model[attribute];
                if (value !== null) {
                    if (_isArray(value)) {
                        values = values.concat(value);
                    } else {
                        values.push(value);
                    }
                }
            });
        } else {
            // composite keys
            _each(models, model => {
                var v = {};
                _each(this.link, (link, attribute) => {
                    v[attribute] = model instanceof Model ? model.get(attribute) : model[attribute];
                });
                values.push(v);
            });
        }

        this.andWhere([
            'in',
            attributes,
            _uniq(values)
        ]);
    }

    /**
     * @param {ActiveRecord|[]} model
     * @param {[]} attributes
     * @returns {string}
     */
    _getModelKey(model, attributes) {
        if (_size(attributes) > 1) {
            var key = [];
            _each(attributes, attribute => {
                key.push(model instanceof Model ? model.get(attribute) : model[attribute]);
            });

            return JSON.stringify(key);
        } else {
            var attribute = _values(attributes)[0];
            var key = model instanceof Model ? model.get(attribute) : model[attribute];

            return _isNumber(key) || _isString(key) ? key : JSON.stringify(key);
        }
    }

    /**
     * @param {[]} primaryModels either array of AR instances or arrays
     * @returns {[]}
     */
    _findJunctionRows(primaryModels) {
        if (_isEmpty(primaryModels)) {
            return Promise.resolve([]);
        }

        this._filterByModels(primaryModels);
        /** @typedef {ActiveRecord} primaryModel */
        var primaryModel = primaryModels[0];
        var ActiveRecord = require('./BaseActiveRecord');

        if (!(primaryModel instanceof ActiveRecord)) {
            // when primaryModels are array of arrays (asArray case)
            primaryModel = new this.modelClass();
        }

        return this.asArray().all(primaryModel.constructor.getDb());
    }

    /**
     * Sets the [[asArray]] property.
     * @param {boolean} [value] whether to return the query results in terms of arrays instead of Active Records.
     * @returns {Jii.data.ActiveQuery} the query object itself
     */
    asArray(value) {
        value = value !== false;

        this._asArray = value;
        return this;
    }

    /**
     * @param {boolean} value
     */
    setAsArray(value) {
        this._asArray = value;
    }

    /**
     *
     * @returns {boolean}
     */
    getAsArray() {
        return this._asArray;
    }

    /**
     * Alias asArray method
     * @param {boolean} value whether to return the query results in terms of arrays instead of Active Records.
     * @returns {Jii.data.ActiveQuery} the query object itself
     */
    asObject(value) {
        return this.asArray(value);
    }

    /**
     *
     * @param {boolean} value
     */
    setAsObject(value) {
        this.setAsArray(value);
    }

    /**
     *
     * @returns {boolean}
     */
    getAsObject() {
        return this.getAsArray();
    }

    /**
     * Specifies the relations with which this query should be performed.
     *
     * The parameters to this method can be either one or multiple strings, or a single array
     * of relation names and the optional callbacks to customize the relations.
     *
     * A relation name can refer to a relation defined in [[modelClass]]
     * or a sub-relation that stands for a relation of a related record.
     * For example, `orders.address` means the `address` relation defined
     * in the model class corresponding to the `orders` relation.
     *
     * The followings are some usage examples:
     *
     * ~~~
     * // find customers together with their orders and country
     * Customer.find().with('orders', 'country').all();
     * // find customers together with their orders and the orders' shipping address
     * Customer.find().with('orders.address').all();
     * // find customers together with their country and orders of status 1
     * Customer.find().with({
     *     orders: function (query) {
     *         query.andWhere('status = 1');
     *     },
     *     'country',
     * }).all();
     * ~~~
     *
     * You can call `with()` multiple times. Each call will add relations to the existing ones.
     * For example, the following two statements are equivalent:
     *
     * ~~~
     * Customer.find().with('orders', 'country').all();
     * Customer.find().with('orders').with('country').all();
     * ~~~
     *
     * @returns {Jii.data.ActiveQuery} the query object itself
     */
    with() {
        var _with = _toArray(arguments);
        if (_with[0] && _isObject(_with[0])) {
            // the parameter is given as an array
            _with = _with[0];
        }

        if (_isEmpty(this._with)) {
            this._with = _with;
        } else if (!_isEmpty(_with)) {
            _each(_with, (value, name) => {
                if (_isNumber(name)) {
                    // repeating relation is fine as normalizeRelations() handle it well
                    this._with.push(value);
                } else {
                    this._with[name] = value;
                }
            });
        }

        return this;
    }

    /**
     *
     * @returns {Jii.data.ActiveQuery} the query object itself
     */
    setWith(_with) {
        this._with = _with;
    }

    /**
     *
     * @returns {[]}
     */
    getWith() {
        return this._with;
    }

    /**
     * Converts found rows into model instances
     * @param {[]} rows
     * @returns {[]|ActiveRecord[]}
     */
    _createModels(rows) {
        var models = null;
        if (this._asArray) {
            if (this._indexBy === null) {
                return rows;
            }

            models = {};
            _each(rows, row => {
                var key = _isString(this._indexBy) ? row[this._indexBy] : this._indexBy.call(null, row);
                models[key] = row;
            });
        } else {
            /** @typedef {ActiveRecord} _class */
            var _class = this.modelClass;
            if (this._indexBy === null) {

                models = [];
                _each(rows, row => {
                    /** @typedef {ActiveRecord} model */
                    var model = _class.instantiate(row);

                    _class.populateRecord(model, row);
                    models.push(model);
                });
            } else {

                models = {};
                _each(rows, row => {
                    /** @typedef {ActiveRecord} model */
                    var model = _class.instantiate(row);

                    _class.populateRecord(model, row);

                    var key = _isString(this._indexBy) ? model.get(this._indexBy) : this._indexBy.call(null, model);
                    models[key] = model;
                });
            }
        }

        return models;
    }

    /**
     * Finds records corresponding to one or multiple relations and populates them into the primary models.
     * @param {[]} _with a list of relations that this query should be performed with. Please
     * refer to [[with()]] for details about specifying this parameter.
     * @param {[]|ActiveRecord[]} models the primary models (can be either AR instances or arrays)
     */
    findWith(_with, models) {
        var primaryModel = new this.modelClass();
        var relations = this._normalizeRelations(primaryModel, _with);
        var promises = [];

        /** @typedef {Jii.data.ActiveQuery} relation */
        _each(relations, (relation, name) => {
            if (relation.getAsArray() === null) {
                // inherit asArray from primary query
                relation.setAsArray(this._asArray);
            }

            promises.push(relation.populateRelation(name, models));
        });

        return Promise.all(promises);
    }

    /**
     * @param {ActiveRecord} model
     * @param {[]} _with
     * @returns {Object.<string, Jii.data.ActiveQuery>}
     */
    _normalizeRelations(model, _with) {
        var relations = {};
        _each(_with, (callback, name) => {
            if (_isNumber(name)) {
                name = callback;
                callback = null;
            }

            var childName = null;
            var pos = name.indexOf('.');
            if (pos !== -1) {
                // with sub-relations
                childName = name.substr(pos + 1);
                name = name.substr(0, pos);
            }

            var relation = null;
            if (!_has(relations, name)) {
                relation = model.getRelation(name);
                relation.primaryModel = null;
                relations[name] = relation;
            } else {
                relation = relations[name];
            }

            if (childName) {
                var _with = {};
                _with[childName] = callback;
                relation.with(_with);
            } else if (callback !== null) {
                callback.call(null, relation);
            }
        });

        return relations;
    }

}
/**
 * @event Event an event that is triggered when the query is initialized via [[init()]].
 */
ActiveQuery.EVENT_INIT = 'init';
module.exports = ActiveQuery;