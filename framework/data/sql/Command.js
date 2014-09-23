"use strict";

/**
 * Command represents a SQL statement to be executed against a database.
 *
 * A command object is usually created by calling [[Connection.createCommand()]].
 * The SQL statement it represents can be set via the [[sql]] property.
 *
 * To execute a non-query SQL (such as INSERT, DELETE, UPDATE), call [[execute()]].
 * To execute a SQL statement that returns result data set (such as SELECT),
 * use [[queryAll()]], [[queryOne()]], [[queryColumn()]], [[queryScalar()]], or [[query()]].
 * For example,
 *
 * ~~~
 * users = connection.createCommand('SELECT * FROM user').queryAll();
 * ~~~
 *
 * Command supports SQL statement preparation and parameter binding.
 * Call [[bindValue()]] to bind a value to a SQL parameter;
 * Call [[bindParam()]] to bind a PHP variable to a SQL parameter.
 * When binding a parameter, the SQL statement is automatically prepared.
 *
 * Command also supports building SQL statements by providing methods such as [[insert()]],
 * [[update()]], etc. For example,
 *
 * ~~~
 * connection.createCommand().insert('user', {
 *     name: 'Sam',
 *     age: 30,
 * }).execute();
 * ~~~
 *
 * To build SELECT SQL statements, please use [[QueryBuilder]] instead.
 *
 * @class Jii.data.sql.Command
 * @extends Jii.base.Component
 */
Jii.defineClass('Jii.data.sql.Command', {

	__extends: Jii.base.Component,

	__static: {
	},

	/**
	 * @type {Jii.data.sql.BaseConnection} the DB connection that this command is associated with
	 */
	db: null,

	/**
	 * @type {object} the parameters (name => value) that are bound to the current PDO statement.
	 * This property is maintained by methods such as [[bindValue()]].
	 * Do not modify it directly.
	 */
	params: null,

	/**
	 * @type {string} the SQL statement that this command represents
	 */
	_sql: null,

	/**
	 * Returns the SQL statement for this command.
	 * @returns {string} the SQL statement to be executed
	 */
	getSql: function () {
		return this._sql;
	},

	/**
	 * Specifies the SQL statement to be executed.
	 * @param {string} sql the SQL statement to be set.
	 * @returns {static} this command instance
	 */
	setSql: function (sql) {
		if (this._sql !== sql) {
			this._sql = this.db.quoteSql(sql);
			this.params = {};
		}

		return this;
	},

	/**
	 * Returns the raw SQL by inserting parameter values into the corresponding placeholders in [[sql]].
	 * Note that the return value of this method should mainly be used for logging purpose.
	 * It is likely that this method returns an invalid SQL due to improper replacement of parameter placeholders.
	 * @returns {string} the raw SQL with parameter values inserted into the corresponding placeholders in [[sql]].
	 */
	getRawSql: function () {
		if (_.isEmpty(this.params)) {
			return this._sql;
		}

		// Quote values
		var params = {};
		_.each(this.params, function (value, name) {
			params[name] = this.db.quoteValue(value);
		}.bind(this));

		// Format `key = ?`
		if (_.has(params, 1)) {
			var sql = '';
			_.each(this._sql.split('?'), function (part, i) {
				sql += (params[i] || '') + part;
			});
			return sql;
		}

		// Format `:name = 'John'`
		var sql2 = this._sql;
		_.each(params, function (value, name) {
			name = name.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
			var regExp = new RegExp(name, "g");
			sql2 = sql2.replace(regExp, value);
		}.bind(this));
		return sql2;
	},

	/**
	 * Binds a value to a parameter.
	 * @param {string|number} name Parameter identifier. For a prepared statement
	 * using named placeholders, this will be a parameter name of
	 * the form `:name`. For a prepared statement using question mark
	 * placeholders, this will be the 1-indexed position of the parameter.
	 * @param {*} value The value to bind to the parameter
	 * @returns {static} the current command being executed
	 */
	bindValue: function (name, value) {
		this.params[name] = value;
		return this;
	},

	/**
	 * Binds a list of values to the corresponding parameters.
	 * This is similar to [[bindValue()]] except that it binds multiple values at a time.
	 * Note that the SQL data type of each value is determined by its PHP type.
	 * @param {object} values the values to be bound. This must be given in terms of an associative
	 * array with array keys being the parameter names, and array values the corresponding parameter values,
	 * e.g. `{':name': 'John', ':age': 25}`.
	 * @returns {static} the current command being executed
	 */
	bindValues: function (values) {
		_.extend(this.params, values);
		return this;
	},

	/**
	 * Executes the SQL statement.
	 * This method should only be used for executing non-query SQL statement, such as `INSERT`, `DELETE`, `UPDATE` SQLs.
	 * No result set will be returned.
	 * @returns {Promise.<number>} number of rows affected by the execution.
	 * @throws Exception execution failed
	 */
	execute: function () {
		var sql = this.getSql();
		var rawSql = this.getRawSql();

		//Jii.info(rawSql, __METHOD__);

		if (!sql) {
			return Promise.resolve(0);
		}

		//var token = rawSql;
		//Jii.beginProfile(token, __METHOD__);
		return this.db.exec(rawSql).then(function(result) {
			//Jii.endProfile(token, __METHOD__);

			return result.affectedRows;
		}, function(exception) {

			//Jii.endProfile(token, __METHOD__);
			//$this->db->getSchema()->handleException($e, $rawSql);

			return Promise.reject(exception, rawSql);
		}).catch(Jii.catchHandler());
	},

	/**
	 * Executes the SQL statement and returns query result.
	 * This method is for executing a SQL query that returns result set, such as `SELECT`.
	 * @returns {Promise} the reader object for fetching the query result
	 * @throws Exception execution failed
	 */
	query: function () {
		// @todo
		//return this._queryInternal('');
	},

	/**
	 * Executes the SQL statement and returns ALL rows at once.
	 * @returns {Promise} all rows of the query result. Each array element is an array representing a row of data.
	 * An empty array is returned if the query results in nothing.
	 * @throws Exception execution failed
	 */
	queryAll: function () {
		return this._queryInternal('all');
	},

	/**
	 * Executes the SQL statement and returns the first row of the result.
	 * This method is best used when only the first row of result is needed for a query.
	 * @returns {Promise} the first row (in terms of an array) of the query result. False is returned if the query
	 * results in nothing.
	 * @throws Exception execution failed
	 */
	queryOne: function () {
		return this._queryInternal('one');
	},

	/**
	 * Executes the SQL statement and returns the value of the first column in the first row of data.
	 * This method is best used when only a single value is needed for a query.
	 * @returns {Promise} the value of the first column in the first row of the query result.
	 * False is returned if there is no value.
	 * @throws Exception execution failed
	 */
	queryScalar: function () {
		return this._queryInternal('scalar');
	},

	/**
	 * Executes the SQL statement and returns the first column of the result.
	 * This method is best used when only the first column of result (i.e. the first element in each row)
	 * is needed for a query.
	 * @returns {Promise} the first column of the query result. Empty array is returned if the query results in nothing.
	 * @throws Exception execution failed
	 */
	queryColumn: function () {
		return this._queryInternal('column');
	},

	/**
	 * Performs the actual DB query of a SQL statement.
	 * @param {string} method
	 * @returns {Promise} the method execution result
	 * @throws Exception if the query causes any problem
	 */
	_queryInternal: function (method) {
		var rawSql = this.getRawSql();

		//Jii.info(rawSql, 'Jii.data.sql.Command.query');

		//var token = rawSql;
		//Jii.beginProfile(token, 'Jii.data.sql.Command.query');
		return this.db.exec(rawSql, method).then(function(result) {
			//Jii.endProfile(token, __METHOD__);

			return result;
		}, function(exception) {
			//Jii.endProfile(token, 'Jii.data.sql.Command.query');
			//$this->db->getSchema()->handleException($e, $rawSql);

			return Promise.reject(exception, rawSql);
		}).catch(Jii.catchHandler());
	},

	/**
	 * Creates an INSERT command.
	 * For example,
	 *
	 * ~~~
	 * connection.createCommand().insert('user', {
	 *     name: 'Sam',
	 *     age: 30,
	 * }).execute();
	 * ~~~
	 *
	 * The method will properly escape the column names, and bind the values to be inserted.
	 *
	 * Note that the created command is not executed until [[execute()]] is called.
	 *
	 * @param {string} table the table that new rows() will be inserted into.
	 * @param {object} columns the column data (name => value) to be inserted into the table.
	 * @returns {static} the command object itself
	 */
	insert: function (table, columns) {
		var params = {};
		var sql = this.db.getQueryBuilder().insert(table, columns, params);

		return this.setSql(sql).bindValues(params);
	},

	/**
	 * Creates a batch INSERT command.
	 * For example,
	 *
	 * ~~~
	 * connection.createCommand().batchInsert('user', ['name', 'age'], [
	 *     ['Tom', 30],
	 *     ['Jane', 20],
	 *     ['Linda', 25],
	 * ]).execute();
	 * ~~~
	 *
	 * Note that the values in each row must match the corresponding column names.
	 *
	 * @param {string} table the table that new rows() will be inserted into.
	 * @param {object} columns the column names
	 * @param {[]} rows the rows to be batch inserted into the table
	 * @returns {static} the command object itself
	 */
	batchInsert: function (table, columns, rows) {
		var sql = this.db.getQueryBuilder().batchInsert(table, columns, rows);
		return this.setSql(sql);
	},

	/**
	 * Creates an UPDATE command.
	 * For example,
	 *
	 * ~~~
	 * connection.createCommand().update('user', {status: 1}, 'age > 30').execute();
	 * ~~~
	 *
	 * The method will properly escape the column names and bind the values to be updated.
	 *
	 * Note that the created command is not executed until [[execute()]] is called.
	 *
	 * @param {string} table the table to be updated.
	 * @param {[]} columns the column data (name => value) to be updated.
	 * @param {string|[]} [condition] the condition that will be put in the WHERE part. Please
	 * refer to [[Query.where()]] on how to specify condition.
	 * @param {object} [params] the parameters to be bound to the command
	 * @returns {static} the command object itself
	 */
	update: function (table, columns, condition, params) {
		condition = condition || '';
		params = params || [];

		var sql = this.db.getQueryBuilder().update(table, columns, condition, params);

		return this.setSql(sql).bindValues(params);
	},

	/**
	 * Creates a DELETE command.
	 * For example,
	 *
	 * ~~~
	 * connection.createCommand().delete('user', 'status = 0').execute();
	 * ~~~
	 *
	 * The method will properly escape the table and column names.
	 *
	 * Note that the created command is not executed until [[execute()]] is called.
	 *
	 * @param {string} table the table where the data will be deleted from.
	 * @param {string|[]} [condition] the condition that will be put in the WHERE part. Please
	 * refer to [[Query.where()]] on how to specify condition.
	 * @param {object} [params] the parameters to be bound to the command
	 * @returns {static} the command object itself
	 */
	delete: function (table, condition, params) {
		var sql = this.db.getQueryBuilder().delete(table, condition, params);
		return this.setSql(sql).bindValues(params);
	},

	/**
	 * Creates a SQL command for creating a new DB() table.
	 *
	 * The columns in the new table() should be specified as name-definition pairs (e.g. 'name' => 'string'),
	 * where name stands for a column name which will be properly quoted by the method, and definition
	 * stands for the column type which can contain an abstract DB type.
	 * The method [[QueryBuilder.getColumnType()]] will be called
	 * to convert the abstract column types to physical ones. For example, `string` will be converted
	 * as `varchar(255)`, and `string not null` becomes `varchar(255) not null`.
	 *
	 * If a column is specified with definition only (e.g. 'PRIMARY KEY (name, type)'), it will be directly
	 * inserted into the generated SQL.
	 *
	 * @param {string} table the name of the table to be created. The name will be properly quoted by the method.
	 * @param {object} columns the columns (name => definition) in the new table.()
	 * @param {string} [options] additional SQL fragment that will be appended to the generated SQL.
	 * @returns {static} the command object itself
	 */
	createTable: function (table, columns, options) {
		options = options || null;

		var sql = this.db.getQueryBuilder().createTable(table, columns, options);
		return this.setSql(sql);
	},

	/**
	 * Creates a SQL command for renaming a DB table.
	 * @param {string} table the table to be renamed. The name will be properly quoted by the method.
	 * @param {string} newName the new table() name. The name will be properly quoted by the method.
	 * @returns {static} the command object itself
	 */
	renameTable: function (table, newName) {
		var sql = this.db.getQueryBuilder().renameTable(table, newName);
		return this.setSql(sql);
	},

	/**
	 * Creates a SQL command for dropping a DB table.
	 * @param {string} table the table to be dropped. The name will be properly quoted by the method.
	 * @returns {static} the command object itself
	 */
	dropTable: function (table) {
		var sql = this.db.getQueryBuilder().dropTable(table);
		return this.setSql(sql);
	},

	/**
	 * Creates a SQL command for truncating a DB table.
	 * @param {string} table the table to be truncated. The name will be properly quoted by the method.
	 * @returns {static} the command object itself
	 */
	truncateTable: function (table) {
		var sql = this.db.getQueryBuilder().truncateTable(table);
		return this.setSql(sql);
	},

	/**
	 * Creates a SQL command for adding a new DB() column.
	 * @param {string} table the table that the new column() will be added to. The table name will be properly quoted by the method.
	 * @param {string} column the name of the new column.() The name will be properly quoted by the method.
	 * @param {string} type the column type. [[\Jii.data.sql.QueryBuilder.getColumnType()]] will be called
	 * to convert the give column type to the physical one. For example, `string` will be converted
	 * as `varchar(255)`, and `string not null` becomes `varchar(255) not null`.
	 * @returns {static} the command object itself
	 */
	addColumn: function (table, column, type) {
		var sql = this.db.getQueryBuilder().addColumn(table, column, type);
		return this.setSql(sql);
	},

	/**
	 * Creates a SQL command for dropping a DB column.
	 * @param {string} table the table whose column is to be dropped. The name will be properly quoted by the method.
	 * @param {string} column the name of the column to be dropped. The name will be properly quoted by the method.
	 * @returns {static} the command object itself
	 */
	dropColumn: function (table, column) {
		var sql = this.db.getQueryBuilder().dropColumn(table, column);
		return this.setSql(sql);
	},

	/**
	 * Creates a SQL command for renaming a column.
	 * @param {string} table the table whose column is to be renamed. The name will be properly quoted by the method.
	 * @param {string} oldName the old name of the column. The name will be properly quoted by the method.
	 * @param {string} newName the new name() of the column. The name will be properly quoted by the method.
	 * @returns {static} the command object itself
	 */
	renameColumn: function (table, oldName, newName) {
		var sql = this.db.getQueryBuilder().renameColumn(table, oldName, newName);
		return this.setSql(sql);
	},

	/**
	 * Creates a SQL command for changing the definition of a column.
	 * @param {string} table the table whose column is to be changed. The table name will be properly quoted by the method.
	 * @param {string} column the name of the column to be changed. The name will be properly quoted by the method.
	 * @param {string} type the column type. [[\Jii.data.sql.QueryBuilder.getColumnType()]] will be called
	 * to convert the give column type to the physical one. For example, `string` will be converted
	 * as `varchar(255)`, and `string not null` becomes `varchar(255) not null`.
	 * @returns {static} the command object itself
	 */
	alterColumn: function (table, column, type) {
		var sql = this.db.getQueryBuilder().alterColumn(table, column, type);
		return this.setSql(sql);
	},

	/**
	 * Creates a SQL command for adding a primary key constraint to an existing table.
	 * The method will properly quote the table and column names.
	 * @param {string} name the name of the primary key constraint.
	 * @param {string} table the table that the primary key constraint will be added to.
	 * @param {string|[]} columns comma separated string or array of columns that the primary key will consist of.
	 * @returns {static} the command object itself.
	 */
	addPrimaryKey: function (name, table, columns) {
		var sql = this.db.getQueryBuilder().addPrimaryKey(name, table, columns);
		return this.setSql(sql);
	},

	/**
	 * Creates a SQL command for removing a primary key constraint to an existing table.
	 * @param {string} name the name of the primary key constraint to be removed.
	 * @param {string} table the table that the primary key constraint will be removed from.
	 * @returns {static} the command object itself
	 */
	dropPrimaryKey: function (name, table) {
		var sql = this.db.getQueryBuilder().dropPrimaryKey(name, table);
		return this.setSql(sql);
	},

	/**
	 * Creates a SQL command for adding a foreign key constraint to an existing table.
	 * The method will properly quote the table and column names.
	 * @param {string} name the name of the foreign key constraint.
	 * @param {string} table the table that the foreign key constraint will be added to.
	 * @param {string} columns the name of the column to that the constraint will be added on. If there are multiple columns, separate them with commas.
	 * @param {string} refTable the table that the foreign key references to.
	 * @param {string} refColumns the name of the column that the foreign key references to. If there are multiple columns, separate them with commas.
	 * @param {string} [deleteOption] the ON DELETE option. Most DBMS support these options: RESTRICT, CASCADE, NO ACTION, SET DEFAULT, SET NULL
	 * @param {string} [updateOption] the ON UPDATE option. Most DBMS support these options: RESTRICT, CASCADE, NO ACTION, SET DEFAULT, SET NULL
	 * @returns {static} the command object itself
	 */
	addForeignKey: function (name, table, columns, refTable, refColumns, deleteOption, updateOption) {
		deleteOption = deleteOption || null;
		updateOption = updateOption || null;

		var sql = this.db.getQueryBuilder().addForeignKey(name, table, columns, refTable, refColumns, deleteOption, updateOption);
		return this.setSql(sql);
	},

	/**
	 * Creates a SQL command for dropping a foreign key constraint.
	 * @param {string} name the name of the foreign key constraint to be dropped. The name will be properly quoted by the method.
	 * @param {string} table the table whose foreign is to be dropped. The name will be properly quoted by the method.
	 * @returns {static} the command object itself
	 */
	dropForeignKey: function (name, table) {
		var sql = this.db.getQueryBuilder().dropForeignKey(name, table);
		return this.setSql(sql);
	},

	/**
	 * Creates a SQL command for creating a new index.()
	 * @param {string} name the name of the index. The name will be properly quoted by the method.
	 * @param {string} table the table that the new index() will be created for. The table name will be properly quoted by the method.
	 * @param {string|[]} columns the column(s) that should be included in the index. If there are multiple columns, please separate them
	 * by commas. The column names will be properly quoted by the method.
	 * @param {boolean} [unique] whether to add UNIQUE constraint on the created index.
	 * @returns {static} the command object itself
	 */
	createIndex: function (name, table, columns, unique) {
		unique = unique || false;

		var sql = this.db.getQueryBuilder().createIndex(name, table, columns, unique);
		return this.setSql(sql);
	},

	/**
	 * Creates a SQL command for dropping an index.
	 * @param {string} name the name of the index to be dropped. The name will be properly quoted by the method.
	 * @param {string} table the table whose index is to be dropped. The name will be properly quoted by the method.
	 * @returns {static} the command object itself
	 */
	dropIndex: function (name, table) {
		var sql = this.db.getQueryBuilder().dropIndex(name, table);
		return this.setSql(sql);
	},

	/**
	 * Creates a SQL command for resetting the sequence value of a table's primary key.
	 * The sequence will be reset such that the primary key of the next new row() inserted
	 * will have the specified value or 1.
	 * @param {string} table the name of the table whose primary key sequence will be reset
	 * @param {*} [value] the value for the primary key of the next new row() inserted. If this is not set,
	 * the next new row()'s primary key will have a value 1.
	 * @returns {static} the command object itself
	 * @throws Jii.data.sql.NotSupportedException if this is not supported by the underlying DBMS
	 */
	resetSequence: function (table, value) {
		value = value || null;

		var sql = this.db.getQueryBuilder().resetSequence(table, value);
		return this.setSql(sql);
	},

	/**
	 * Builds a SQL command for enabling or disabling integrity check.
	 * @param {boolean} check whether to turn on or off the integrity check.
	 * @param {string} schema the schema name of the tables. Defaults to empty string, meaning the current
	 * or default schema.
	 * @param {string} table the table name.
	 * @returns {static} the command object itself
	 * @throws Jii.data.sql.NotSupportedException if this is not supported by the underlying DBMS
	 */
	checkIntegrity: function (check, schema, table) {
		check = check || true;
		schema = schema || '';
		table = table || '';

		var sql = this.db.getQueryBuilder().checkIntegrity(check, schema, table);
		return this.setSql(sql);
	}

});