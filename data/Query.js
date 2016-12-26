/**
 *
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Expression = require('./Expression');
var _isString = require('lodash/isString');
var _isEmpty = require('lodash/isEmpty');
var _isArray = require('lodash/isArray');
var _isObject = require('lodash/isObject');
var _isUndefined = require('lodash/isUndefined');
var _each = require('lodash/each');
var _extend = require('lodash/extend');
var _has = require('lodash/has');
var _toNumber = require('lodash/toNumber');
var _words = require('lodash/words');
var _trim = require('lodash/trim');
var Component = require('../base/Component');

class Query extends Component {

    preInit() {
        /**
         * @type {string|function} column the name of the column by which the query results should be indexed by.
         * This can also be a callable (e.g. anonymous function) that returns the index value based on the given
         * row data. For more details, see [[indexBy()]]. This property is only used by [[QueryInterface.all()|all()]].
         */
        this._indexBy = null;

        /**
         * @type {object} how to sort the query results. This is used to construct the ORDER BY clause in a SQL statement.
         * The array keys are the columns to be sorted by, and the array values are the corresponding sort directions which
         * can be either [SORT_ASC](http://php.net/manual/en/array.constants.php#constant.sort-asc)
         * or [SORT_DESC](http://php.net/manual/en/array.constants.php#constant.sort-desc).
         * The array may also contain [[Expression]] objects. If that is the case, the expressions
         * will be converted into strings without any change.
         */
        this._orderBy = null;

        /**
         * @type {number} zero-based offset from where the records are to be returned. If not set or
         * less than 0, it means starting from the beginning.
         */
        this._offset = null;

        /**
         * @type {number} maximum number of records to be returned. If not set or less than 0, it means no limit.
         */
        this._limit = null;

        /**
         * @type {string|[]} query condition. This refers to the WHERE clause in a SQL statement.
         * For example, `age > 31 AND team = 1`.
         * @see where()
         */
        this._where = null;

        /**
         * @type {object} list of query parameter values indexed by parameter placeholders.
         * For example, `{':name': 'Dan', ':age': 31}`.
         */
        this._params = null;

        /**
         * @type {[]} this is used to construct the UNION clause(s) in a SQL statement.
         * Each array element is an array of the following structure:
         *
         * - `query`: either a string or a [[Query]] object representing a query
         * - `all`: boolean, whether it should be `UNION ALL` or `UNION`
         */
        this._union = [];

        /**
         * @type {string|[]} the condition to be applied in the GROUP BY clause.
         * It can be either a string or an array. Please refer to [[where()]] on how to specify the condition.
         */
        this._having = null;

        /**
         * @type {[]} how to join with other tables. Each array element represents the specification
         * of one join which has the following structure:
         *
         * ~~~
         * [joinType, tableName, joinCondition]
         * ~~~
         *
         * For example,
         *
         * ~~~
         * {
         *     ['INNER JOIN', 'user', 'user.id = author_id'],
         *     ['LEFT JOIN', 'team', 'team.id = team_id'],
         * }
         * ~~~
         */
        this._join = [];

        /**
         * @type {[]} how to group the query results. For example, `['company', 'department']`.
         * This is used to construct the GROUP BY clause in a SQL statement.
         */
        this._groupBy = null;

        /**
         * @type {[]} the table(s) to be selected from. For example, `['user', 'post']`.
         * This is used to construct the FROM clause in a SQL statement.
         * @see from()
         */
        this._from = null;

        /**
         * @type {boolean} whether to select distinct rows of data only. If this is set true,
         * the SELECT clause would be changed to SELECT DISTINCT.
         */
        this._distinct = null;

        /**
         * @type {string} additional option that should be appended to the 'SELECT' keyword. For example,
         * in MySQL, the option 'SQL_CALC_FOUND_ROWS' can be used.
         */
        this._selectOption = null;

        /**
         * @type {[]} the columns being selected. For example, `['id', 'name']`.
         * This is used to construct the SELECT clause in a SQL statement. If not set, it means selecting all columns.
         * @see select()
         */
        this._select = null;

        super.preInit(...arguments);
    }

    /**
     * Creates a new Query object and copies its property values from an existing one.
     * The properties being copies are the ones to be used by query builders.
     * @param {Jii.data.Query} from the source query object
     * @return {Jii.data.Query} the new Query object
     */
    static createFromQuery(from) {
        return new this({
            where: from.getWhere(),
            limit: from.getLimit(),
            offset: from.getOffset(),
            orderBy: from.getOrderBy(),
            indexBy: from.getIndexBy(),
            select: from.getSelect(),
            selectOption: from.getSelectOption(),
            distinct: from.getDistinct(),
            from: from.getFrom(),
            groupBy: from.getGroupBy(),
            join: from.getJoin(),
            having: from.getHaving(),
            union: from.getUnion(),
            params: from.getParams()
        });
    }

    /**
     * Creates a DB command that can be used to execute this query.
     * @param {Jii.data.BaseConnection} [db] the database connection used to generate the SQL statement.
     * If this parameter is not given, the `db` application component will be used.
     * @returns {Promise} the created DB command instance.
     */
    createCommand(db) {
        db = db || Jii.app.getComponent('db');

        return db.getQueryBuilder().build(this).then(buildParams => {
            var sql = buildParams[0];
            var params = buildParams[1];

            return db.createCommand(sql, params);
        });
    }

    /**
     * Prepares for building SQL.
     * This method is called by [[Jii.data.QueryBuilder]] when it starts to build SQL from a query object.
     * You may override this method to do some final preparation work when converting a query into a SQL statement.
     * @param {Jii.data.QueryBuilder} builder
     */
    prepare(builder) {
        return Promise.resolve(this);
    }

    /**
     * Starts a batch query.
     *
     * A batch query supports fetching data in batches, which can keep the memory usage under a limit.
     * This method will return a [[BatchQueryResult]] object which implements the `Iterator` interface
     * and can be traversed to retrieve the data in batches.
     *
     * For example,
     *
     * ```js
     * query = (new Query()).from('user');
     * _each(query.batch(), rows => {
     *     // rows is an array of 10 or fewer rows from user table
     * });
     * ```
     *
     * @param {number} batchSize the number of records to be fetched in each batch.
     * @param {Jii.sql.Connection} db the database connection. If not set, the "db" application component will be used.
     * @returns {Jii.sql.BatchQueryResult} the batch query result. It implements the `Iterator` interface
     * and can be traversed to retrieve the data in batches.
     */
    /*batch(batchSize, db) {
     batchSize = batchSize || '';
     db = db || null;

     return Jii.createObject({
     className: Jii.sql.BatchQueryResult,
     query: this,
     batchSize: batchSize,
     db: db,
     each: false
     });
     },*/
    /**
     * Starts a batch query and retrieves data row by row.
     * This method is similar to [[batch()]] except that in each iteration of the result,
     * only one row of data is returned. For example,
     *
     * ```js
     * query = (new Query()).from('user');
     * _each(query.each(), row => {
     * });
     * ```
     *
     * @param {number} batchSize the number of records to be fetched in each batch.
     * @param {Jii.sql.Connection} db the database connection. If not set, the "db" application component will be used.
     * @returns {Jii.sql.BatchQueryResult} the batch query result. It implements the `Iterator` interface
     * and can be traversed to retrieve the data in batches.
     */
    /*each(batchSize, db) {
     batchSize = batchSize || '';
     db = db || null;

     return Jii.createObject({
     className: Jii.sql.BatchQueryResult,
     query: this,
     batchSize: batchSize,
     db: db,
     each: true
     });
     },*/
    /**
     * Executes the query and returns all results as an array.
     * @param {Jii.data.BaseConnection} [db] the database connection used to generate the SQL statement.
     * If this parameter is not given, the `db` application component will be used.
     * @returns {object} the query results. If the query results in nothing, an empty array will be returned.
     */
    all(db) {
        db = db || null;

        return this.createCommand(db).then(command => {
            return command.queryAll();
        }).then(rows => {
            return this.populate(rows);
        });
    }

    /**
     * Converts the raw query results into the format as specified by this query.
     * This method is internally used to convert the data fetched from database
     * into the format as required by this query.
     * @param {[]} rows the raw query result from database
     * @returns {object} the converted query result
     */
    populate(rows) {
        if (this._indexBy === null) {
            return rows;
        }

        var result = {};
        _each(rows, row => {
            var key = _isString(this._indexBy) ? row[this._indexBy] : this._indexBy(row);

            result[key] = row;
        });

        return result;
    }

    /**
     * Executes the query and returns a single row of result.
     * @param {Jii.sql.Connection} [db] the database connection used to generate the SQL statement.
     * If this parameter is not given, the `db` application component will be used.
     * @returns {[]|boolean} the first row (in terms of an array) of the query result. False is returned if the query
     * results in nothing.
     */
    one(db) {
        db = db || null;

        return this.createCommand(db).then(command => {
            return command.queryOne();
        });
    }

    /**
     * Returns the query result as a scalar value.
     * The value returned will be the first column in the first row of the query results.
     * @param {Jii.sql.Connection} [db] the database connection used to generate the SQL statement.
     * If this parameter is not given, the `db` application component will be used.
     * @returns {string|boolean} the value of the first column in the first row of the query result.
     * False is returned if the query result is empty.
     */
    scalar(db) {
        db = db || null;

        return this.createCommand(db).then(command => {
            return command.queryScalar();
        });
    }

    /**
     * Executes the query and returns the first column of the result.
     * @param {Jii.sql.Connection} [db] the database connection used to generate the SQL statement.
     * If this parameter is not given, the `db` application component will be used.
     * @returns {[]} the first column of the query result. An empty array is returned if the query results in nothing.
     */
    column(db) {
        db = db || null;

        return this.createCommand(db).then(command => {
            return command.queryColumn();
        });
    }

    /**
     * Returns the number of records.
     * @param {string} [q] the COUNT expression. Defaults to '*'.
     * Make sure you properly quote column names in the expression.
     * @param {Jii.sql.Connection} [db] the database connection used to generate the SQL statement.
     * If this parameter is not given (or null), the `db` application component will be used.
     * @returns {Promise.promise} number of records
     */
    count(q, db) {
        q = q || '*';
        db = db || null;

        return this._queryScalar('COUNT(' + q + ')', db).then(result => {
            return _toNumber(result);
        });
    }

    /**
     * Returns the sum of the specified column values.
     * @param {string} q the column name or expression.
     * Make sure you properly quote column names in the expression.
     * @param {Jii.sql.Connection} db the database connection used to generate the SQL statement.
     * If this parameter is not given, the `db` application component will be used.
     * @returns {Promise.promise} the sum of the specified column values
     */
    sum(q, db) {
        db = db || null;

        return this._queryScalar('SUM(' + q + ')', db).then(result => {
            return _toNumber(result);
        });
    }

    /**
     * Returns the average of the specified column values.
     * @param {string} q the column name or expression.
     * Make sure you properly quote column names in the expression.
     * @param {Jii.sql.Connection} db the database connection used to generate the SQL statement.
     * If this parameter is not given, the `db` application component will be used.
     * @returns {Promise.promise} the average of the specified column values.
     */
    average(q, db) {
        db = db || null;

        return this._queryScalar('AVG(' + q + ')', db).then(result => {
            return _toNumber(result);
        });
    }

    /**
     * Returns the minimum of the specified column values.
     * @param {string} q the column name or expression.
     * Make sure you properly quote column names in the expression.
     * @param {Jii.sql.Connection} db the database connection used to generate the SQL statement.
     * If this parameter is not given, the `db` application component will be used.
     * @returns {Promise.promise} the minimum of the specified column values.
     */
    min(q, db) {
        db = db || null;

        return this._queryScalar('MIN(' + q + ')', db).then(result => {
            return _toNumber(result);
        });
    }

    /**
     * Returns the maximum of the specified column values.
     * @param {string} q the column name or expression.
     * Make sure you properly quote column names in the expression.
     * @param {Jii.sql.Connection} db the database connection used to generate the SQL statement.
     * If this parameter is not given, the `db` application component will be used.
     * @returns {Promise.promise} the maximum of the specified column values.
     */
    max(q, db) {
        db = db || null;

        return this._queryScalar('MAX(' + q + ')', db).then(result => {
            return _toNumber(result);
        });
    }

    /**
     * Returns a value indicating whether the query result contains any row of data.
     * @param {Jii.sql.Connection} db the database connection used to generate the SQL statement.
     * If this parameter is not given, the `db` application component will be used.
     * @returns {Promise} whether the query result contains any row of data.
     */
    exists(db) {
        db = db || null;

        var select = this._select;
        this._select = [new Expression('1')];

        return this.createCommand(db).then(command => {
            return command.queryScalar();
        }).then(value => {
            this._select = select;

            return value !== null;
        });
    }

    /**
     * Queries a scalar value by setting [[select]] first.
     * Restores the value of select to make this query reusable.
     * @param {string|Jii.data.Expression} selectExpression
     * @param {Jii.sql.Connection|null} db
     * @returns {boolean|string}
     */
    _queryScalar(selectExpression, db) {
        var select = this._select;
        var limit = this._limit;
        var offset = this._offset;

        this._select = [selectExpression];
        this._limit = null;
        this._offset = null;

        return this.createCommand(db).then(command => {
            this._select = select;
            this._limit = limit;
            this._offset = offset;

            if (_isEmpty(this._groupBy) && _isEmpty(this._union) && !this._distinct) {
                return command.queryScalar();
            } else {
                return new this.constructor().select([selectExpression]).from({
                    c: this
                }).createCommand(command.db).then(command => {
                    return command.queryScalar();
                });
            }
        });
    }

    /**
     * Sets the SELECT part of the query.
     * @param {string|[]} columns the columns to be selected.
     * Columns can be specified in either a string (e.g. "id, name") or an array (e.g. ['id', 'name']).
     * Columns can be prefixed with table names (e.g. "user.id") and/or contain column aliases (e.g. "user.id AS user_id").
     * The method will automatically quote the column names unless a column contains some parenthesis
     * (which means the column contains a DB expression).
     *
     * Note that if you are selecting an expression like `CONCAT(first_name, ' ', last_name)`, you should
     * use an array to specify the columns. Otherwise, the expression may be incorrectly split into several parts.
     *
     * When the columns are specified as an array, you may also use array keys as the column aliases (if a column
     * does not need alias, do not use a string key).
     *
     * @param {string} [option] additional option that should be appended to the 'SELECT' keyword. For example,
     * in MySQL, the option 'SQL_CALC_FOUND_ROWS' can be used.
     * @returns {Jii.data.Query} the query object itself
     */
    select(columns, option) {
        option = option || null;

        if (!_isArray(columns)) {
            columns = _words(columns, /[^,]+/g);
        }
        this._select = columns;
        this._selectOption = option;
        return this;
    }

    /**
     *
     * @returns {Jii.data.Query} the query object itself
     */
    setSelect(select) {
        this._select = select;
    }

    /**
     *
     * @returns {string|[]}
     */
    getSelect() {
        return this._select;
    }

    /**
     *
     * @param {string} [option] additional option that should be appended to the 'SELECT' keyword. For example,
     * in MySQL, the option 'SQL_CALC_FOUND_ROWS' can be used.
     * @returns {Jii.data.Query} the query object itself
     */
    setSelectOption(option) {
        this._selectOption = option;
        return this;
    }

    /**
     *
     * @returns {string}
     */
    getSelectOption() {
        return this._selectOption;
    }

    /**
     * Add more columns to the SELECT part of the query.
     * @param {string|[]} columns the columns to add to the select.
     * @returns {Jii.data.Query} the query object itself
     * @see select()
     */
    addSelect(columns) {
        if (!_isArray(columns) && !_isObject(columns)) {
            columns = _words(columns, /[^,]+/g);
        }
        if (this._select === null) {
            this._select = columns;
        } else {
            this._select = _isArray(columns) ? this._select.concat(columns) : _extend(columns, this._select);
        }
        return this;
    }

    /**
     * Sets the value indicating whether to SELECT DISTINCT or not.
     * @param {boolean} [value] whether to SELECT DISTINCT or not.
     * @returns {Jii.data.Query} the query object itself
     */
    distinct(value) {
        value = !_isUndefined(value) ? value : true;

        this._distinct = !!value;
        return this;
    }

    /**
     *
     * @returns {Jii.data.Query} the query object itself
     */
    setDistinct(distinct) {
        this._distinct = distinct;
    }

    /**
     *
     * @returns {boolean}
     */
    getDistinct() {
        return this._distinct;
    }

    /**
     * Sets the FROM part of the query.
     * @param {string|[]} tables the table(s) to be selected from. This can be either a string (e.g. `'user'`)
     * or an array (e.g. `['user', 'profile']`) specifying one or several table names.
     * Table names can contain schema prefixes (e.g. `'public.user'`) and/or table aliases (e.g. `'user u'`).
     * The method will automatically quote the table names unless it contains some parenthesis
     * (which means the table is given as a sub-query or DB expression).
     *
     * When the tables are specified as an array, you may also use the array keys as the table aliases
     * (if a table does not need alias, do not use a string key).
     *
     * Use a Query object to represent a sub-query. In this case, the corresponding array key will be used
     * as the alias for the sub-query.
     *
     * @returns {Jii.data.Query} the query object itself
     */
    from(tables) {
        if (_isString(tables)) {
            tables = _words(tables, /[^,]+/g);
        }
        this._from = tables;
        return this;
    }

    /**
     *
     * @returns {Jii.data.Query} the query object itself
     */
    setFrom(from) {
        this._from = from;
    }

    /**
     *
     * @returns {string|[]}
     */
    getFrom() {
        return this._from;
    }

    /**
     * Sets the WHERE part of the query.
     *
     * The method requires a condition parameter, and optionally a params parameter
     * specifying the values to be bound to the query.
     *
     * The condition parameter should be either a string (e.g. 'id=1') or an array.
     * If the latter, it must be in one of the following two formats:
     *
     * - hash format: `{'column1': value1, 'column2': value2, ...}`
     * - operator format: `[operator, operand1, operand2, ...]`
     *
     * A condition in hash format represents the following SQL expression in general:
     * `column1=value1 AND column2=value2 AND ...`. In case when a value is an array or a Query object,
     * an `IN` expression will be generated. And if a value is null, `IS NULL` will be used
     * in the generated expression. Below are some examples:
     *
     * - `{type: 1, status: 2}` generates `(type = 1) AND (status = 2)`.
     * - `{id: [1, 2, 3], status: 2}` generates `(id IN (1, 2, 3)) AND (status = 2)`.
     * - `{status: null} generates `status IS NULL`.
     * - `{id: query}` generates `id IN (...sub-query...)`
     *
     * A condition in operator format generates the SQL expression according to the specified operator, which
     * can be one of the followings:
     *
     * - `and`: the operands should be concatenated together using `AND`. For example,
     *   `['and', 'id=1', 'id=2']` will generate `id=1 AND id=2`. If an operand is an array,
     *   it will be converted into a string using the rules described here. For example,
     *   `['and', 'type=1', ['or', 'id=1', 'id=2']]` will generate `type=1 AND (id=1 OR id=2)`.
     *   The method will NOT do any quoting or escaping.
     *
     * - `or`: similar to the `and` operator except that the operands are concatenated using `OR`.
     *
     * - `between`: operand 1 should be the column name, and operand 2 and 3 should be the
     *   starting and ending values of the range that the column is in.
     *   For example, `['between', 'id', 1, 10]` will generate `id BETWEEN 1 AND 10`.
     *
     * - `not between`: similar to `between` except the `BETWEEN` is replaced with `NOT BETWEEN`
     *   in the generated condition.
     *
     * - `in`: operand 1 should be a column or DB expression with parenthesis. Operand 2 can be an array
     *   or a Query object. If the former, the array represents the range of the values that the column
     *   or DB expression should be in. If the latter, a sub-query will be generated to represent the range.
     *   For example, `['in', 'id', [1, 2, 3]]` will generate `id IN (1, 2, 3)`;
     *   `['in', 'id', (new Query()).select('id').from('user'))]` will generate
     *   `id IN (SELECT id FROM user)`. The method will properly quote the column name and escape values in the range.
     *
     * - `not in`: similar to the `in` operator except that `IN` is replaced with `NOT IN` in the generated condition.
     *
     * - `like`: operand 1 should be a column or DB expression, and operand 2 be a string or an array representing
     *   the values that the column or DB expression should be like.
     *   For example, `['like', 'name', 'tester']` will generate `name LIKE '%tester%'`.
     *   When the value range is given as an array, multiple `LIKE` predicates will be generated and concatenated
     *   using `AND`. For example, `['like', 'name', ['test', 'sample']]` will generate
     *   `name LIKE '%test%' AND name LIKE '%sample%'`.
     *   The method will properly quote the column name and escape special characters in the values.
     *   Sometimes, you may want to add the percentage characters to the matching value by yourself, you may supply
     *   a third operand `false` to do so. For example, `['like', 'name', '%tester', false]` will generate `name LIKE '%tester'`.
     *
     * - `or like`: similar to the `like` operator except that `OR` is used to concatenate the `LIKE`
     *   predicates when operand 2 is an array.
     *
     * - `not like`: similar to the `like` operator except that `LIKE` is replaced with `NOT LIKE`
     *   in the generated condition.
     *
     * - `or not like`: similar to the `not like` operator except that `OR` is used to concatenate
     *   the `NOT LIKE` predicates.
     *
     * - `exists`: requires one operand which must be an instance of [[Query]] representing the sub-query.
     *   It will build a `EXISTS (sub-query)` expression.
     *
     * - `not exists`: similar to the `exists` operator and builds a `NOT EXISTS (sub-query)` expression.
     *
     * @param {string|object|[]} condition the conditions that should be put in the WHERE part.
     * @param {object} [params] the parameters (name: value) to be bound to the query.
     * @returns {Jii.data.Query} the query object itself
     * @see andWhere()
     * @see orWhere()
     */
    where(condition, params) {
        params = params || {};

        this._where = condition;
        this.addParams(params);
        return this;
    }

    /**
     *
     * @returns {Jii.data.Query} the query object itself
     */
    setWhere(where) {
        this._where = where;
    }

    /**
     *
     * @returns {string|[]}
     */
    getWhere() {
        return this._where;
    }

    /**
     * Adds an additional WHERE condition to the existing one.
     * The new condition() and the existing one will be joined using the 'AND' operator.
     * @param {string|object|[]} condition the new WHERE() condition. Please refer to [[where()]]
     * on how to specify this parameter.
     * @param {object} [params] the parameters (name: value) to be bound to the query.
     * @returns {Jii.data.Query} the query object itself
     * @see where()
     * @see orWhere()
     */
    andWhere(condition, params) {
        params = params || {};

        if (this._where === null) {
            this._where = condition;
        } else {
            this._where = [
                'and',
                this._where,
                condition
            ];
        }
        this.addParams(params);
        return this;
    }

    /**
     * Adds an additional WHERE condition to the existing one.
     * The new condition() and the existing one will be joined using the 'OR' operator.
     * @param {string|object|[]} condition the new WHERE() condition. Please refer to [[where()]]
     * on how to specify this parameter.
     * @param {object} [params] the parameters (name: value) to be bound to the query.
     * @returns {Jii.data.Query} the query object itself
     * @see where()
     * @see andWhere()
     */
    orWhere(condition, params) {
        params = params || {};

        if (this._where === null) {
            this._where = condition;
        } else {
            this._where = [
                'or',
                this._where,
                condition
            ];
        }
        this.addParams(params);
        return this;
    }

    /**
     * Appends a JOIN part to the query.
     * The first parameter specifies what type of join it is.
     * @param {string} type the type of join, such as INNER JOIN, LEFT JOIN.
     * @param {string|[]} table the table to be joined.
     *
     * Use string to represent the name of the table to be joined.
     * Table name can contain schema prefix (e.g. 'public.user') and/or table alias (e.g. 'user u').
     * The method will automatically quote the table name unless it contains some parenthesis
     * (which means the table is given as a sub-query or DB expression).
     *
     * Use array to represent joining with a sub-query. The array must contain only one element.
     * The value must be a Query object representing the sub-query while the corresponding key
     * represents the alias for the sub-query.
     *
     * @param {string|[]} [on] the join condition that should appear in the ON part.
     * Please refer to [[where()]] on how to specify this parameter.
     * @param {object} params the parameters (name: value) to be bound to the query.
     * @returns {Jii.data.Query} the query object itself
     */
    join(type, table, on, params) {
        on = on || '';
        params = params || {};

        this._join.push([
            type,
            table,
            on
        ]);
        return this.addParams(params);
    }

    /**
     *
     * @returns {Jii.data.Query} the query object itself
     */
    setJoin(join) {
        this._join = join;
    }

    /**
     *
     * @returns {string|[]}
     */
    getJoin() {
        return this._join;
    }

    /**
     *
     * @returns {string|[]}
     */
    getJoinWith() {
        return this._joinWith;
    }

    /**
     * Appends an INNER JOIN part to the query.
     * @param {string|[]} table the table to be joined.
     *
     * Use string to represent the name of the table to be joined.
     * Table name can contain schema prefix (e.g. 'public.user') and/or table alias (e.g. 'user u').
     * The method will automatically quote the table name unless it contains some parenthesis
     * (which means the table is given as a sub-query or DB expression).
     *
     * Use array to represent joining with a sub-query. The array must contain only one element.
     * The value must be a Query object representing the sub-query while the corresponding key
     * represents the alias for the sub-query.
     *
     * @param {string|[]} [on] the join condition that should appear in the ON part.
     * Please refer to [[where()]] on how to specify this parameter.
     * @param {object} [params] the parameters (name: value) to be bound to the query.
     * @returns {Jii.data.Query} the query object itself
     */
    innerJoin(table, on, params) {
        on = on || '';
        params = params || {};

        this._join.push([
            'INNER JOIN',
            table,
            on
        ]);
        return this.addParams(params);
    }

    /**
     * Appends a LEFT OUTER JOIN part to the query.
     * @param {string|[]} table the table to be joined.
     *
     * Use string to represent the name of the table to be joined.
     * Table name can contain schema prefix (e.g. 'public.user') and/or table alias (e.g. 'user u').
     * The method will automatically quote the table name unless it contains some parenthesis
     * (which means the table is given as a sub-query or DB expression).
     *
     * Use array to represent joining with a sub-query. The array must contain only one element.
     * The value must be a Query object representing the sub-query while the corresponding key
     * represents the alias for the sub-query.
     *
     * @param {string|[]} [on] the join condition that should appear in the ON part.
     * Please refer to [[where()]] on how to specify this parameter.
     * @param {object} [params] the parameters (name: value) to be bound to the query
     * @returns {Jii.data.Query} the query object itself
     */
    leftJoin(table, on, params) {
        on = on || '';
        params = params || {};

        this._join.push([
            'LEFT JOIN',
            table,
            on
        ]);
        return this.addParams(params);
    }

    /**
     * Appends a RIGHT OUTER JOIN part to the query.
     * @param {string|[]} table the table to be joined.
     *
     * Use string to represent the name of the table to be joined.
     * Table name can contain schema prefix (e.g. 'public.user') and/or table alias (e.g. 'user u').
     * The method will automatically quote the table name unless it contains some parenthesis
     * (which means the table is given as a sub-query or DB expression).
     *
     * Use array to represent joining with a sub-query. The array must contain only one element.
     * The value must be a Query object representing the sub-query while the corresponding key
     * represents the alias for the sub-query.
     *
     * @param {string|[]} on the join condition that should appear in the ON part.
     * Please refer to [[where()]] on how to specify this parameter.
     * @param {object} [params] the parameters (name: value) to be bound to the query
     * @returns {Jii.data.Query} the query object itself
     */
    rightJoin(table, on, params) {
        on = on || '';
        params = params || {};

        this._join.push([
            'RIGHT JOIN',
            table,
            on
        ]);
        return this.addParams(params);
    }

    /**
     * Sets the GROUP BY part of the query.
     * @param {string|[]} columns the columns to be grouped by.
     * Columns can be specified in either a string (e.g. "id, name") or an array (e.g. ['id', 'name']).
     * The method will automatically quote the column names unless a column contains some parenthesis
     * (which means the column contains a DB expression).
     * @returns {Jii.data.Query} the query object itself
     * @see addGroupBy()
     */
    groupBy(columns) {
        if (!_isArray(columns)) {
            columns = _words(columns, /[^,]+/g);
        }
        this._groupBy = columns;
        return this;
    }

    /**
     *
     * @returns {Jii.data.Query} the query object itself
     */
    setGroupBy(groupBy) {
        this._groupBy = groupBy;
    }

    /**
     *
     * @returns {string|[]}
     */
    getGroupBy() {
        return this._groupBy;
    }

    /**
     * Adds additional group-by columns to the existing ones.
     * @param {string|[]} columns additional columns to be grouped by.
     * Columns can be specified in either a string (e.g. "id, name") or an array (e.g. ['id', 'name']).
     * The method will automatically quote the column names unless a column contains some parenthesis
     * (which means the column contains a DB expression).
     * @returns {Jii.data.Query} the query object itself
     * @see groupBy()
     */
    addGroupBy(columns) {
        if (!_isArray(columns)) {
            columns = _words(columns, /[^,]+/g);
        }
        if (this._groupBy === null) {
            this._groupBy = columns;
        } else {
            this._groupBy = this._groupBy.concat(columns);
        }
        return this;
    }

    /**
     * Sets the HAVING part of the query.
     * @param {string|[]} condition the conditions to be put after HAVING.
     * Please refer to [[where()]] on how to specify this parameter.
     * @param {object} [params] the parameters (name: value) to be bound to the query.
     * @returns {Jii.data.Query} the query object itself
     * @see andHaving()
     * @see orHaving()
     */
    having(condition, params) {
        params = params || {};

        this._having = condition;
        this.addParams(params);
        return this;
    }

    /**
     *
     * @returns {Jii.data.Query} the query object itself
     */
    setHaving(having) {
        this._having = having;
    }

    /**
     *
     * @returns {string|[]}
     */
    getHaving() {
        return this._having;
    }

    /**
     * Adds an additional HAVING condition to the existing one.
     * The new condition() and the existing one will be joined using the 'AND' operator.
     * @param {string|[]} condition the new HAVING() condition. Please refer to [[where()]]
     * on how to specify this parameter.
     * @param {object} [params] the parameters (name: value) to be bound to the query.
     * @returns {Jii.data.Query} the query object itself
     * @see having()
     * @see orHaving()
     */
    andHaving(condition, params) {
        params = params || {};

        if (this._having === null) {
            this._having = condition;
        } else {
            this._having = [
                'and',
                this._having,
                condition
            ];
        }
        this.addParams(params);
        return this;
    }

    /**
     * Adds an additional HAVING condition to the existing one.
     * The new condition() and the existing one will be joined using the 'OR' operator.
     * @param {string|[]} condition the new HAVING() condition. Please refer to [[where()]]
     * on how to specify this parameter.
     * @param {object} [params] the parameters (name: value) to be bound to the query.
     * @returns {Jii.data.Query} the query object itself
     * @see having()
     * @see andHaving()
     */
    orHaving(condition, params) {
        params = params || {};

        if (this._having === null) {
            this._having = condition;
        } else {
            this._having = [
                'or',
                this._having,
                condition
            ];
        }
        this.addParams(params);
        return this;
    }

    /**
     * Appends a SQL statement using UNION operator.
     * @param {string|Jii.data.Query} sql the SQL statement to be appended using UNION
     * @param {boolean} [all] TRUE if using UNION ALL and FALSE if using UNION
     * @returns {Jii.data.Query} the query object itself
     */
    union(sql, all) {
        all = all || false;

        this._union.push({
            query: sql,
            all: all
        });
        return this;
    }

    /**
     *
     * @returns {Jii.data.Query} the query object itself
     */
    setUnion(union) {
        return this._union = union;
    }

    /**
     *
     * @returns {[]}
     */
    getUnion() {
        return this._union;
    }

    /**
     * Sets the parameters to be bound to the query.
     * @param {object} params list of query parameter values indexed by parameter placeholders.
     * For example, `{':name': 'Dan', ':age': 31}`.
     * @returns {Jii.data.Query} the query object itself
     * @see addParams()
     */
    params(params) {
        this._params = params;
        return this;
    }

    /**
     *
     * @returns {Jii.data.Query} the query object itself
     */
    setParams(params) {
        this._params = params;
    }

    /**
     *
     * @returns {object}
     */
    getParams() {
        return this._params;
    }

    /**
     * Adds additional parameters to be bound to the query.
     * @param {object} params list of query parameter values indexed by parameter placeholders.
     * For example, `{':name': 'Dan', ':age': 31}`.
     * @returns {Jii.data.Query} the query object itself
     * @see params()
     */
    addParams(params) {
        if (!_isEmpty(params)) {
            if (_isEmpty(this._params)) {
                this._params = params;
            } else {
                this._params = {};
                _each(params, (value, name) => {
                    this._params[name] = value;
                });
            }
        }
        return this;
    }

    /**
     * Sets the [[indexBy]] property.
     * @param {string|function} column the name of the column by which the query results should be indexed by.
     * This can also be a callable (e.g. anonymous function) that returns the index value based on the given
     * row data. The signature of the callable should be:
     *
     * ~~~
     * function (row)
     * {
     *     // return the index value corresponding to row
     * }
     * ~~~
     *
     * @returns {Jii.data.Query} the query object itself.
     */
    indexBy(column) {
        this._indexBy = column;
        return this;
    }

    /**
     *
     * @returns {Jii.data.Query} the query object itself
     */
    setIndexBy(indexBy) {
        this._indexBy = indexBy;
    }

    /**
     *
     * @returns {string|function}
     */
    getIndexBy() {
        return this._indexBy;
    }

    /**
     * Sets the WHERE part of the query but ignores [[isEmpty()|empty operands]].
     *
     * This method is similar to [[where()]]. The main difference is that this method will
     * remove [[isEmpty()|empty query operands]]. As a result, this method is best suited
     * for building query conditions based on filter values entered by users.
     *
     * The following code shows the difference between this method and [[where()]]:
     *
     * ```js
     * // WHERE `age`=:age
     * query.filterWhere({name: null, age: 20});
     * // WHERE `age`=:age
     * query.where({age: 20});
     * // WHERE `name` IS NULL AND `age`=:age
     * query.where({name: null, age: 20});
     * ```
     *
     * Note that unlike [[where()]], you cannot pass binding parameters to this method.
     *
     * @param {[]|object} condition the conditions that should be put in the WHERE part.
     * See [[where()]] on how to specify this parameter.
     * @returns {Jii.data.Query} the query object itself.
     * @see where()
     * @see andFilterWhere()
     * @see orFilterWhere()
     */
    filterWhere(condition) {
        condition = this._filterCondition(condition);
        if (!_isEmpty(condition)) {
            this.where(condition);
        }
        return this;
    }

    /**
     * Adds an additional WHERE condition to the existing one but ignores [[isEmpty()|empty operands]].
     * The new condition() and the existing one will be joined using the 'AND' operator.
     *
     * This method is similar to [[andWhere()]]. The main difference is that this method will
     * remove [[isEmpty()|empty query operands]]. As a result, this method is best suited
     * for building query conditions based on filter values entered by users.
     *
     * @param {[]|object} condition the new WHERE() condition. Please refer to [[where()]]
     * on how to specify this parameter.
     * @returns {Jii.data.Query} the query object itself.
     * @see filterWhere()
     * @see orFilterWhere()
     */
    andFilterWhere(condition) {
        condition = this._filterCondition(condition);
        if (!_isEmpty(condition)) {
            this.andWhere(condition);
        }
        return this;
    }

    /**
     * Adds an additional WHERE condition to the existing one but ignores [[isEmpty()|empty operands]].
     * The new condition() and the existing one will be joined using the 'OR' operator.
     *
     * This method is similar to [[orWhere()]]. The main difference is that this method will
     * remove [[isEmpty()|empty query operands]]. As a result, this method is best suited
     * for building query conditions based on filter values entered by users.
     *
     * @param {[]|object} condition the new WHERE() condition. Please refer to [[where()]]
     * on how to specify this parameter.
     * @returns {Jii.data.Query} the query object itself.
     * @see filterWhere()
     * @see andFilterWhere()
     */
    orFilterWhere(condition) {
        condition = this._filterCondition(condition);
        if (!_isEmpty(condition)) {
            this.orWhere(condition);
        }
        return this;
    }

    /**
     * Removes [[isEmpty()|empty operands]] from the given query condition.
     *
     * @param {[]|object} condition the original condition
     * @returns {[]} the condition with [[isEmpty()|empty operands]] removed.
     * @throws NotSupportedException if the condition operator is not supported
     */
    _filterCondition(condition) {
        if (!_isObject(condition) && !_isArray(condition)) {
            return condition;
        }

        if (!condition[0]) {
            // hash format: 'column1': 'value1', 'column2': 'value2', ...
            _each(condition, (value, name) => {
                if (this._isEmpty(value)) {
                    delete condition[name];
                }
            });
            return condition;
        }

        // operator format: operator, operand 1, operand 2, ...
        var operator = condition.shift();

        switch (operator.toUpperCase()) {
            case 'NOT':
            case 'AND':
            case 'OR':
                _each(condition, (operand, i) => {
                    var subCondition = this._filterCondition(operand);
                    if (this._isEmpty(subCondition)) {
                        delete condition[i];
                    } else {
                        condition[i] = subCondition;
                    }
                });

                if (_isEmpty(condition)) {
                    return [];
                }
                break;

            /*case 'IN':
             case 'NOT IN':
             case 'LIKE':
             case 'OR LIKE':
             case 'NOT LIKE':
             case 'OR NOT LIKE':
             case 'ILIKE': // PostgreSQL operator for case insensitive LIKE
             case 'OR ILIKE':
             case 'NOT ILIKE':
             case 'OR NOT ILIKE':
             if (condition[1] && this._isEmpty(condition[1])) {
             return [];
             }
             break;*/

            case 'BETWEEN':
            case 'NOT BETWEEN':
                if (_has(condition, 1) && _has(condition, 2)) {
                    if (this._isEmpty(condition[1]) || this._isEmpty(condition[2])) {
                        return [];
                    }
                }
                break;

            default:
                if (_has(condition, 1) && this._isEmpty(condition[1])) {
                    return [];
                }
        }

        condition.unshift(operator);

        return condition;
    }

    /**
     * Returns a value indicating whether the give value is "empty".
     *
     * The value is considered "empty", if one of the following conditions is satisfied:
     *
     * - it is `null`,
     * - an empty string (`''`),
     * - a string containing only whitespace characters,
     * - or an empty array.
     *
     * @param {*} value
     * @returns {boolean} if the value is empty
     */
    _isEmpty(value) {
        return value === '' || _isArray(value) && value.length === 0 || value === null || _isString(value) && _trim(value) === '';
    }

    /**
     * Sets the ORDER BY part of the query.
     * @param {string|object} columns the columns (and the directions) to be ordered by.
     * Columns can be specified in either a string (e.g. `"id ASC, name DESC"`) or an array
     * (e.g. `{id: SORT_ASC, name: SORT_DESC}`).
     * The method will automatically quote the column names unless a column contains some parenthesis
     * (which means the column contains a DB expression).
     * Note that if your order-by is an expression containing commas, you should always use an array
     * to represent the order-by information. Otherwise, the method will not be able to correctly determine
     * the order-by columns.
     * @returns {Jii.data.Query} the query object itself.
     * @see addOrderBy()
     */
    orderBy(columns) {
        this._orderBy = this._normalizeOrderBy(columns);
        return this;
    }

    /**
     *
     * @returns {Jii.data.Query} the query object itself
     */
    setOrderBy(orderBy) {
        this._orderBy = orderBy;
    }

    /**
     *
     * @returns {string|object}
     */
    getOrderBy() {
        return this._orderBy;
    }

    /**
     * Adds additional ORDER BY columns to the query.
     * @param {string|object} columns the columns (and the directions) to be ordered by.
     * Columns can be specified in either a string (e.g. "id ASC, name DESC") or an array
     * (e.g. `{id: SORT_ASC, name: SORT_DESC}`).
     * The method will automatically quote the column names unless a column contains some parenthesis
     * (which means the column contains a DB expression).
     * @returns {Jii.data.Query} the query object itself.
     * @see orderBy()
     */
    addOrderBy(columns) {
        columns = this._normalizeOrderBy(columns);

        if (this._orderBy === null) {
            this._orderBy = columns;
        } else {
            this._orderBy = _extend(this._orderBy, columns);
        }
        return this;
    }

    _normalizeOrderBy(columns) {
        if (_isObject(columns) && !_isArray(columns)) {
            return columns;
        }

        columns = _words(columns, /[^,]+/g);
        var result = {};
        var regExp = /^(.*?)\s+(asc|desc)/i;

        _each(columns, column => {
            column = _trim(column);

            var matches = regExp.exec(column);
            if (matches !== null) {
                result[matches[1]] = matches[2].toLowerCase() === 'desc' ? Query.SORT_DESC : Query.SORT_ASC;
            } else {
                result[column] = Query.SORT_ASC;
            }
        });

        return result;
    }

    /**
     * Sets the LIMIT part of the query.
     * @param {number} limit the limit. Use null or negative value to disable limit.
     * @returns {Jii.data.Query} the query object itself.
     */
    limit(limit) {
        this._limit = limit;
        return this;
    }

    /**
     *
     * @returns {Jii.data.Query} the query object itself
     */
    setLimit(limit) {
        this._limit = limit;
    }

    /**
     *
     * @returns {number}
     */
    getLimit() {
        return this._limit;
    }

    /**
     * Sets the OFFSET part of the query.
     * @param {number} offset the offset. Use null or negative value to disable offset.
     * @returns {Jii.data.Query} the query object itself.
     */
    offset(offset) {
        this._offset = offset;
        return this;
    }

    /**
     *
     * @returns {Jii.data.Query} the query object itself
     */
    setOffset(offset) {
        this._offset = offset;
    }

    /**
     *
     * @returns {number}
     */
    getOffset() {
        return this._offset;
    }

}
Query.SORT_DESC = 'DESC';

Query.SORT_ASC = 'ASC';
module.exports = Query;