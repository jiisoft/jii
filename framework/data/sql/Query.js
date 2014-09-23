/**
 *
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

/**
 * Query represents a SELECT SQL statement in a way that is independent of DBMS.
 *
 * Query provides a set of methods to facilitate the specification of different clauses
 * in a SELECT statement. These methods can be chained together.
 *
 * By calling [[createCommand()]], we can get a [[Command]] instance which can be further
 * used to perform/execute the DB query against a database.
 *
 * For example,
 *
 * ```js
 * query = new Jii.data.sql.Query();
 * // compose the query
 * query.select('id, name')
 *     .from('user')
 *     .limit(10);
 * // build and execute the query
 * rows = query.all();
 * // alternatively, you can create DB command and execute it
 * command = query.createCommand();
 * // command.sql returns the actual SQL
 * rows = command.queryAll();
 * ```
 *
 * @class Jii.data.sql.Query
 * @extends Jii.base.Component
 */
Jii.defineClass('Jii.data.sql.Query', {

	__extends: Jii.base.Component,

	__static: {
		SORT_ASC : 'ASC',
		SORT_DESC : 'DESC'
	},

	/**
	 * @type {[]} the columns being selected. For example, `['id', 'name']`.
	 * This is used to construct the SELECT clause in a SQL statement. If not set, it means selecting all columns.
	 * @see select()
	 */
	_select: null,

	/**
	 * @type {string} additional option that should be appended to the 'SELECT' keyword. For example,
	 * in MySQL, the option 'SQL_CALC_FOUND_ROWS' can be used.
	 */
	_selectOption: null,

	/**
	 * @type {boolean} whether to select distinct rows of data only. If this is set true,
	 * the SELECT clause would be changed to SELECT DISTINCT.
	 */
	_distinct: null,

	/**
	 * @type {[]} the table(s) to be selected from. For example, `['user', 'post']`.
	 * This is used to construct the FROM clause in a SQL statement.
	 * @see from()
	 */
	_from: null,

	/**
	 * @type {[]} how to group the query results. For example, `['company', 'department']`.
	 * This is used to construct the GROUP BY clause in a SQL statement.
	 */
	_groupBy: null,

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
	_join: null,

	/**
	 * @type {string|[]} the condition to be applied in the GROUP BY clause.
	 * It can be either a string or an array. Please refer to [[where()]] on how to specify the condition.
	 */
	_having: null,

	/**
	 * @type {[]} this is used to construct the UNION clause(s) in a SQL statement.
	 * Each array element is an array of the following structure:
	 *
	 * - `query`: either a string or a [[Query]] object representing a query
	 * - `all`: boolean, whether it should be `UNION ALL` or `UNION`
	 */
	_union: null,

	/**
	 * @type {object} list of query parameter values indexed by parameter placeholders.
	 * For example, `{':name': 'Dan', ':age': 31}`.
	 */
	_params: null,

	/**
	 * @type {string|[]} query condition. This refers to the WHERE clause in a SQL statement.
	 * For example, `age > 31 AND team = 1`.
	 * @see where()
	 */
	_where: null,

	/**
	 * @type {number} maximum number of records to be returned. If not set or less than 0, it means no limit.
	 */
	_limit: null,

	/**
	 * @type {number} zero-based offset from where the records are to be returned. If not set or
	 * less than 0, it means starting from the beginning.
	 */
	_offset: null,

	/**
	 * @type {object} how to sort the query results. This is used to construct the ORDER BY clause in a SQL statement.
	 * The array keys are the columns to be sorted by, and the array values are the corresponding sort directions which
	 * can be either [SORT_ASC](http://php.net/manual/en/array.constants.php#constant.sort-asc)
	 * or [SORT_DESC](http://php.net/manual/en/array.constants.php#constant.sort-desc).
	 * The array may also contain [[Expression]] objects. If that is the case, the expressions
	 * will be converted into strings without any change.
	 */
	_orderBy: null,

	/**
	 * @type {string|function} column the name of the column by which the query results should be indexed by.
	 * This can also be a callable (e.g. anonymous function) that returns the index value based on the given
	 * row data. For more details, see [[indexBy()]]. This property is only used by [[QueryInterface.all()|all()]].
	 */
	_indexBy: null,

	/**
	 * Creates a DB command that can be used to execute this query.
	 * @param {Jii.data.sql.Connection} [db] the database connection used to generate the SQL statement.
	 * If this parameter is not given, the `db` application component will be used.
	 * @returns {Jii.data.sql.Command} the created DB command instance.
	 */
	createCommand: function (db) {
		db = db || Jii.app.getDb();

		var buildParams = db.getQueryBuilder().build(this);
		var sql = buildParams[0];
		var params = buildParams[1];

		return db.createCommand(sql, params);
	},

	/**
	 * Prepares for building SQL.
	 * This method is called by [[Jii.data.sql.QueryBuilder]] when it starts to build SQL from a query object.
	 * You may override this method to do some final preparation work when converting a query into a SQL statement.
	 * @param {Jii.data.sql.QueryBuilder} builder
	 */
	prepareBuild: function (builder) {
	},

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
	 * query = (new Jii.data.sql.Query()).from('user');
	 * _.each(query.batch(), _.bind(function(rows) {
     *     // rows is an array of 10 or fewer rows from user table
     * }, this));
	 * ```
	 *
	 * @param {number} batchSize the number of records to be fetched in each batch.
	 * @param {Jii.data.sql.Connection} db the database connection. If not set, the "db" application component will be used.
	 * @returns {Jii.data.sql.BatchQueryResult} the batch query result. It implements the `Iterator` interface
	 * and can be traversed to retrieve the data in batches.
	 */
	batch: function (batchSize, db) {
		batchSize = batchSize || '';
		db = db || null;

		return Jii.createObject({
			class: Jii.data.sql.BatchQueryResult.className(),
			query: this,
			batchSize: batchSize,
			db: db,
			each: false
		});
	},

	/**
	 * Starts a batch query and retrieves data row by row.
	 * This method is similar to [[batch()]] except that in each iteration of the result,
	 * only one row of data is returned. For example,
	 *
	 * ```js
	 * query = (new Query()).from('user');
	 * _.each(query.each(), _.bind(function(row) {
     * }, this));
	 * ```
	 *
	 * @param {number} batchSize the number of records to be fetched in each batch.
	 * @param {Jii.data.sql.Connection} db the database connection. If not set, the "db" application component will be used.
	 * @returns {Jii.data.sql.BatchQueryResult} the batch query result. It implements the `Iterator` interface
	 * and can be traversed to retrieve the data in batches.
	 */
	each: function (batchSize, db) {
		batchSize = batchSize || '';
		db = db || null;

		return Jii.createObject({
			class: Jii.data.sql.BatchQueryResult.className(),
			query: this,
			batchSize: batchSize,
			db: db,
			each: true
		});
	},

	/**
	 * Executes the query and returns all results as an array.
	 * @param {Jii.data.sql.Connection} db the database connection used to generate the SQL statement.
	 * If this parameter is not given, the `db` application component will be used.
	 * @returns {object} the query results. If the query results in nothing, an empty array will be returned.
	 */
	all: function (db) {
		db = db || null;

		var rows = this.createCommand(db).queryAll();
		return this.prepareResult(rows);
	},

	/**
	 * Converts the raw query results into the format as specified by this query.
	 * This method is internally used to convert the data fetched from database
	 * into the format as required by this query.
	 * @param {[]} rows the raw query result from database
	 * @returns {object} the converted query result
	 */
	prepareResult: function (rows) {
		if (this._indexBy === null) {
			return rows;
		}

		var result = {};
		_.each(rows, _.bind(function(row) {
			var key = _.isString(this._indexBy) ?
				row[this._indexBy] :
				this._indexBy(row);

			result[key] = row;
		}, this));

		return result;
	},

	/**
	 * Executes the query and returns a single row of result.
	 * @param {Jii.data.sql.Connection} db the database connection used to generate the SQL statement.
	 * If this parameter is not given, the `db` application component will be used.
	 * @returns {[]|boolean} the first row (in terms of an array) of the query result. False is returned if the query
	 * results in nothing.
	 */
	one: function (db) {
		db = db || null;

		return this.createCommand(db).queryOne();
	},

	/**
	 * Returns the query result as a scalar value.
	 * The value returned will be the first column in the first row of the query results.
	 * @param {Jii.data.sql.Connection} db the database connection used to generate the SQL statement.
	 * If this parameter is not given, the `db` application component will be used.
	 * @returns {string|boolean} the value of the first column in the first row of the query result.
	 * False is returned if the query result is empty.
	 */
	scalar: function (db) {
		db = db || null;

		return this.createCommand(db).queryScalar();
	},

	/**
	 * Executes the query and returns the first column of the result.
	 * @param {Jii.data.sql.Connection} db the database connection used to generate the SQL statement.
	 * If this parameter is not given, the `db` application component will be used.
	 * @returns {[]} the first column of the query result. An empty array is returned if the query results in nothing.
	 */
	column: function (db) {
		db = db || null;

		return this.createCommand(db).queryColumn();
	},

	/**
	 * Returns the number of records.
	 * @param {string} q the COUNT expression. Defaults to '*'.
	 * Make sure you properly quote column names in the expression.
	 * @param {Jii.data.sql.Connection} db the database connection used to generate the SQL statement.
	 * If this parameter is not given (or null), the `db` application component will be used.
	 * @returns {number} number of records
	 */
	count: function (q, db) {
		q = q || '';
		db = db || null;

		return this.queryScalar("COUNT(q)", db);
	},

	/**
	 * Returns the sum of the specified column values.
	 * @param {string} q the column name or expression.
	 * Make sure you properly quote column names in the expression.
	 * @param {Jii.data.sql.Connection} db the database connection used to generate the SQL statement.
	 * If this parameter is not given, the `db` application component will be used.
	 * @returns {number} the sum of the specified column values
	 */
	sum: function (q, db) {
		db = db || null;

		return this.queryScalar("SUM(q)", db);
	},

	/**
	 * Returns the average of the specified column values.
	 * @param {string} q the column name or expression.
	 * Make sure you properly quote column names in the expression.
	 * @param {Jii.data.sql.Connection} db the database connection used to generate the SQL statement.
	 * If this parameter is not given, the `db` application component will be used.
	 * @returns {number} the average of the specified column values.
	 */
	average: function (q, db) {
		db = db || null;

		return this.queryScalar("AVG(q)", db);
	},

	/**
	 * Returns the minimum of the specified column values.
	 * @param {string} q the column name or expression.
	 * Make sure you properly quote column names in the expression.
	 * @param {Jii.data.sql.Connection} db the database connection used to generate the SQL statement.
	 * If this parameter is not given, the `db` application component will be used.
	 * @returns {number} the minimum of the specified column values.
	 */
	min: function (q, db) {
		db = db || null;

		return this.queryScalar("MIN(q)", db);
	},

	/**
	 * Returns the maximum of the specified column values.
	 * @param {string} q the column name or expression.
	 * Make sure you properly quote column names in the expression.
	 * @param {Jii.data.sql.Connection} db the database connection used to generate the SQL statement.
	 * If this parameter is not given, the `db` application component will be used.
	 * @returns {number} the maximum of the specified column values.
	 */
	max: function (q, db) {
		db = db || null;

		return this.queryScalar("MAX(q)", db);
	},

	/**
	 * Returns a value indicating whether the query result contains any row of data.
	 * @param {Jii.data.sql.Connection} db the database connection used to generate the SQL statement.
	 * If this parameter is not given, the `db` application component will be used.
	 * @returns {Promise} whether the query result contains any row of data.
	 */
	exists: function (db) {
		db = db || null;

		var select = this._select;
		this._select = [new Jii.data.sql.Expression('1')];
		var command = this.createCommand(db);
		this._select = select;

		return command.queryScalar().then(function(value) {
			return value !== null;
		}).catch(Jii.catchHandler());
	},

	/**
	 * Queries a scalar value by setting [[select]] first.
	 * Restores the value of select to make this query reusable.
	 * @param {string|Jii.data.sql.Expression} selectExpression
	 * @param {Jii.data.sql.Connection|null} db
	 * @returns {boolean|string}
	 */
	_queryScalar: function (selectExpression, db) {
		var select = this._select;
		var limit = this._limit;
		var offset = this._offset;

		this._select = [selectExpression];
		this._limit = null;
		this._offset = null;
		var command = this.createCommand(db);

		this._select = select;
		this._limit = limit;
		this._offset = offset;

		if (_.isEmpty(this._groupBy) && _.isEmpty(this._union) && !this._distinct) {
			return command.queryScalar();
		} else {
			return (new Jii.data.sql.Query()).select([selectExpression])
				.from({c: this})
				.createCommand(db)
				.queryScalar();
		}
	},

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
	 * @returns {static} the query object itself
	 */
	select: function (columns, option) {
		option = option || null;

		if (!_.isArray(columns)) {
			columns = _.string.words(columns, ',');
		}
		this._select = columns;
		this._selectOption = option;
		return this;
	},

	/**
	 *
	 * @returns {string|[]}
	 */
	getSelect: function() {
		return this._select;
	},

	/**
	 *
	 * @returns {string}
	 */
	getSelectOption: function() {
		return this._selectOption;
	},

	/**
	 * Add more columns to the SELECT part of the query.
	 * @param {string|[]} columns the columns to add to the select.
	 * @returns {static} the query object itself
	 * @see select()
	 */
	addSelect: function (columns) {
		if (!_.isArray(columns)) {
			columns = _.string.words(columns, ',');
		}
		if (this._select === null) {
			this._select = columns;
		} else {
			this._select = this._select.concat(columns);
		}
		return this;
	},

	/**
	 * Sets the value indicating whether to SELECT DISTINCT or not.
	 * @param {boolean} [value] whether to SELECT DISTINCT or not.
	 * @returns {static} the query object itself
	 */
	distinct: function (value) {
		value = !_.isUndefined(value) ? value : true;

		this._distinct = !!value;
		return this;
	},

	/**
	 *
	 * @returns {boolean}
	 */
	getDistinct: function() {
		return this._distinct;
	},

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
	 * @returns {static} the query object itself
	 */
	from: function (tables) {
		if (!_.isArray(tables)) {
			tables = _.string.words(tables, ',');
		}
		this._from = tables;
		return this;
	},

	/**
	 *
	 * @returns {string|[]}
	 */
	getFrom: function() {
		return this._from;
	},

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
	 * @param {string|[]} condition the conditions that should be put in the WHERE part.
	 * @param {object} [params] the parameters (name => value) to be bound to the query.
	 * @returns {Jii.data.sql.Query} the query object itself
	 * @see andWhere()
	 * @see orWhere()
	 */
	where: function (condition, params) {
		params = params || {};

		this._where = condition;
		this.addParams(params);
		return this;
	},

	/**
	 *
	 * @returns {string|[]}
	 */
	getWhere: function() {
		return this._where;
	},

	/**
	 * Adds an additional WHERE condition to the existing one.
	 * The new condition() and the existing one will be joined using the 'AND' operator.
	 * @param {string|[]} condition the new WHERE() condition. Please refer to [[where()]]
	 * on how to specify this parameter.
	 * @param {object} [params] the parameters (name => value) to be bound to the query.
	 * @returns {static} the query object itself
	 * @see where()
	 * @see orWhere()
	 */
	andWhere: function (condition, params) {
		params = params || {};

		if (this._where === null) {
			this._where = condition;
		} else {
			this._where = ['and', this._where, condition];
		}
		this.addParams(params);
		return this;
	},

	/**
	 * Adds an additional WHERE condition to the existing one.
	 * The new condition() and the existing one will be joined using the 'OR' operator.
	 * @param {string|[]} condition the new WHERE() condition. Please refer to [[where()]]
	 * on how to specify this parameter.
	 * @param {object} [params] the parameters (name => value) to be bound to the query.
	 * @returns {static} the query object itself
	 * @see where()
	 * @see andWhere()
	 */
	orWhere: function (condition, params) {
		params = params || {};

		if (this._where === null) {
			this._where = condition;
		} else {
			this._where = ['or', this._where, condition];
		}
		this.addParams(params);
		return this;
	},

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
	 * @param {object} params the parameters (name => value) to be bound to the query.
	 * @returns {Jii.data.sql.Query} the query object itself
	 */
	join: function (type, table, on, params) {
		on = on || '';
		params = params || {};

		this._join.push([type, table, on]);
		return this.addParams(params);
	},

	/**
	 *
	 * @returns {string|[]}
	 */
	getJoin: function() {
		return this._join;
	},

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
	 * @param {object} [params] the parameters (name => value) to be bound to the query.
	 * @returns {Jii.data.sql.Query} the query object itself
	 */
	innerJoin: function (table, on, params) {
		on = on || '';
		params = params || {};

		this._join.push(['INNER JOIN', table, on]);
		return this.addParams(params);
	},

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
	 * @param {object} [params] the parameters (name => value) to be bound to the query
	 * @returns {Jii.data.sql.Query} the query object itself
	 */
	leftJoin: function (table, on, params) {
		on = on || '';
		params = params || {};

		this._join.push(['LEFT JOIN', table, on]);
		return this.addParams(params);
	},

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
	 * @param {object} [params] the parameters (name => value) to be bound to the query
	 * @returns {Jii.data.sql.Query} the query object itself
	 */
	rightJoin: function (table, on, params) {
		on = on || '';
		params = params || {};

		this._join.push(['RIGHT JOIN', table, on]);
		return this.addParams(params);
	},

	/**
	 * Sets the GROUP BY part of the query.
	 * @param {string|[]} columns the columns to be grouped by.
	 * Columns can be specified in either a string (e.g. "id, name") or an array (e.g. ['id', 'name']).
	 * The method will automatically quote the column names unless a column contains some parenthesis
	 * (which means the column contains a DB expression).
	 * @returns {static} the query object itself
	 * @see addGroupBy()
	 */
	groupBy: function (columns) {
		if (!_.isArray(columns)) {
			columns = _.string.words(columns, ',');
		}
		this._groupBy = columns;
		return this;
	},

	/**
	 *
	 * @returns {string|[]}
	 */
	getGroupBy: function() {
		return this._groupBy;
	},

	/**
	 * Adds additional group-by columns to the existing ones.
	 * @param {string|[]} columns additional columns to be grouped by.
	 * Columns can be specified in either a string (e.g. "id, name") or an array (e.g. ['id', 'name']).
	 * The method will automatically quote the column names unless a column contains some parenthesis
	 * (which means the column contains a DB expression).
	 * @returns {static} the query object itself
	 * @see groupBy()
	 */
	addGroupBy: function (columns) {
		if (!_.isArray(columns)) {
			columns = _.string.words(columns, ',');
		}
		if (this._groupBy === null) {
			this._groupBy = columns;
		} else {
			this._groupBy = this._groupBy.concat(columns);
		}
		return this;
	},

	/**
	 * Sets the HAVING part of the query.
	 * @param {string|[]} condition the conditions to be put after HAVING.
	 * Please refer to [[where()]] on how to specify this parameter.
	 * @param {object} [params] the parameters (name => value) to be bound to the query.
	 * @returns {static} the query object itself
	 * @see andHaving()
	 * @see orHaving()
	 */
	having: function (condition, params) {
		params = params || {};

		this._having = condition;
		this.addParams(params);
		return this;
	},

	/**
	 *
	 * @returns {string|[]}
	 */
	getHaving: function() {
		return this._having;
	},

	/**
	 * Adds an additional HAVING condition to the existing one.
	 * The new condition() and the existing one will be joined using the 'AND' operator.
	 * @param {string|[]} condition the new HAVING() condition. Please refer to [[where()]]
	 * on how to specify this parameter.
	 * @param {object} [params] the parameters (name => value) to be bound to the query.
	 * @returns {static} the query object itself
	 * @see having()
	 * @see orHaving()
	 */
	andHaving: function (condition, params) {
		params = params || {};

		if (this._having === null) {
			this._having = condition;
		} else {
			this._having = ['and', this._having, condition];
		}
		this.addParams(params);
		return this;
	},

	/**
	 * Adds an additional HAVING condition to the existing one.
	 * The new condition() and the existing one will be joined using the 'OR' operator.
	 * @param {string|[]} condition the new HAVING() condition. Please refer to [[where()]]
	 * on how to specify this parameter.
	 * @param {object} [params] the parameters (name => value) to be bound to the query.
	 * @returns {static} the query object itself
	 * @see having()
	 * @see andHaving()
	 */
	orHaving: function (condition, params) {
		params = params || {};

		if (this._having === null) {
			this._having = condition;
		} else {
			this._having = ['or', this._having, condition];
		}
		this.addParams(params);
		return this;
	},

	/**
	 * Appends a SQL statement using UNION operator.
	 * @param {string|Jii.data.sql.Query} sql the SQL statement to be appended using UNION
	 * @param {boolean} all TRUE if using UNION ALL and FALSE if using UNION
	 * @returns {static} the query object itself
	 */
	union: function (sql, all) {
		all = all || false;

		this._union.push({ query: sql, all: all });
		return this;
	},

	/**
	 *
	 * @returns {[]}
	 */
	getUnion: function() {
		return this._union;
	},

	/**
	 * Sets the parameters to be bound to the query.
	 * @param {object} params list of query parameter values indexed by parameter placeholders.
	 * For example, `{':name': 'Dan', ':age': 31}`.
	 * @returns {static} the query object itself
	 * @see addParams()
	 */
	params: function (params) {
		this._params = params;
		return this;
	},

	/**
	 *
	 * @returns {object}
	 */
	getParams: function() {
		return this._params;
	},

	/**
	 * Adds additional parameters to be bound to the query.
	 * @param {object} params list of query parameter values indexed by parameter placeholders.
	 * For example, `{':name': 'Dan', ':age': 31}`.
	 * @returns {static} the query object itself
	 * @see params()
	 */
	addParams: function (params) {
		if (!_.isEmpty(params)) {
			if (_.isEmpty(this._params)) {
				this._params = params;
			} else {
				this._params = {};
				_.each(params, _.bind(function(value, name) {
					this._params[name] = value;
				}, this));
			}
		}
		return this;
	},

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
	 * @returns {static} the query object itself.
	 */
	indexBy: function (column) {
		this._indexBy = column;
		return this;
	},

	/**
	 *
	 * @returns {string|function}
	 */
	getIndexBy: function() {
		return this._indexBy;
	},

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
	 * @returns {static} the query object itself.
	 * @see where()
	 * @see andFilterWhere()
	 * @see orFilterWhere()
	 */
	filterWhere: function (condition) {
		condition = this._filterCondition(condition);
		if (!_.isEmpty(condition)) {
			this.where(condition);
		}
		return this;
	},

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
	 * @returns {static} the query object itself.
	 * @see filterWhere()
	 * @see orFilterWhere()
	 */
	andFilterWhere: function (condition) {
		condition = this._filterCondition(condition);
		if (!_.isEmpty(condition)) {
			this.andWhere(condition);
		}
		return this;
	},

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
	 * @returns {static} the query object itself.
	 * @see filterWhere()
	 * @see andFilterWhere()
	 */
	orFilterWhere: function (condition) {
		condition = this._filterCondition(condition);
		if (!_.isEmpty(condition)) {
			this.orWhere(condition);
		}
		return this;
	},

	/**
	 * Removes [[isEmpty()|empty operands]] from the given query condition.
	 *
	 * @param {[]|object} condition the original condition
	 * @returns {[]} the condition with [[isEmpty()|empty operands]] removed.
	 * @throws NotSupportedException if the condition operator is not supported
	 */
	_filterCondition: function (condition) {
		if (!_.isPlainObject(condition) && !_.isArray(condition)) {
			return condition;
		}

		if (!condition[0]) {
			// hash format: 'column1' => 'value1', 'column2' => 'value2', ...
			_.each(condition, _.bind(function(value, name) {
				if (this.isEmpty(value)) {
					delete condition[name];
				}
			}, this));
			return condition;
		}

		// operator format: operator, operand 1, operand 2, ...
		var operator = condition.shift();

		switch (operator.toUpperCase()) {
			case 'NOT':
			case 'AND':
			case 'OR':
				_.each(condition, _.bind(function(operand, i) {
					var subCondition = this._filterCondition(operand);
					if (this.isEmpty(subCondition)) {
						delete condition[i];
					} else {
						condition[i] = subCondition;
					}
				}, this));

				if (_.isEmpty(condition)) {
					return [];
				}
				break;

			case 'IN':
			case 'NOT IN':
			case 'LIKE':
			case 'OR LIKE':
			case 'NOT LIKE':
			case 'OR NOT LIKE':
			case 'ILIKE': // PostgreSQL operator for case insensitive LIKE
			case 'OR ILIKE':
			case 'NOT ILIKE':
			case 'OR NOT ILIKE':
				if (condition[1] && this.isEmpty(condition[1])) {
					return [];
				}
				break;

			case 'BETWEEN':
			case 'NOT BETWEEN':
				if (condition[1] && condition[2]) {
					if (this.isEmpty(condition[1]) || this.isEmpty(condition[2])) {
						return [];
					}
				}
				break;

			default:
				throw new Jii.exceptions.NotSupportedException('Operator not supported: `' + operator + '`');
		}

		condition.unshift(operator);

		return condition;
	},

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
	_isEmpty: function (value) {
		return value === '' || (_.isArray(value) && value.length === 0) || value === null || (_.isString(value) && _.string.trim(value) === '');
	},

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
	 * @returns {static} the query object itself.
	 * @see addOrderBy()
	 */
	orderBy: function (columns) {
		this._orderBy = this._normalizeOrderBy(columns);
		return this;
	},

	/**
	 *
	 * @returns {string|object}
	 */
	getOrderBy: function() {
		return this._orderBy;
	},

	/**
	 * Adds additional ORDER BY columns to the query.
	 * @param {string|object} columns the columns (and the directions) to be ordered by.
	 * Columns can be specified in either a string (e.g. "id ASC, name DESC") or an array
	 * (e.g. `{id: SORT_ASC, name: SORT_DESC}`).
	 * The method will automatically quote the column names unless a column contains some parenthesis
	 * (which means the column contains a DB expression).
	 * @returns {static} the query object itself.
	 * @see orderBy()
	 */
	addOrderBy: function (columns) {
		columns = this._normalizeOrderBy(columns);

		if (this._orderBy === null) {
			this._orderBy = columns;
		} else {
			this._orderBy = _.extend(this._orderBy, columns);
		}
		return this;
	},

	_normalizeOrderBy: function (columns) {
		if (_.isPlainObject(columns)) {
			return columns;
		}

		columns = _.string.words(columns, ',');
		var result = [];
		var regExp = /^(.*?)\s+(asc|desc)/i;

		_.each(columns, _.bind(function(column) {
			var matches = regExp.exec(column);
			if (matches !== null) {
				result[matches[1]] = matches[2].toLowerCase() === 'desc' ?
					this.__static.SORT_DESC :
					this.__static.SORT_ASC;
			} else {
				result[column] = this.__static.SORT_ASC;
			}
		}, this));

		return result;
	},

	/**
	 * Sets the LIMIT part of the query.
	 * @param {number} limit the limit. Use null or negative value to disable limit.
	 * @returns {static} the query object itself.
	 */
	limit: function (limit) {
		this._limit = limit;
		return this;
	},

	/**
	 *
	 * @returns {number}
	 */
	getLimit: function() {
		return this._limit;
	},

	/**
	 * Sets the OFFSET part of the query.
	 * @param {number} offset the offset. Use null or negative value to disable offset.
	 * @returns {static} the query object itself.
	 */
	offset: function (offset) {
		this._offset = offset;
		return this;
	},

	/**
	 *
	 * @returns {number}
	 */
	getOffset: function() {
		return this._offset;
	}

});