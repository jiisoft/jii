/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

/**
 * @class Jii.data.sql.BaseSchema
 * @extends Jii.base.Object
 */
Jii.defineClass('Jii.data.sql.BaseSchema', {

	__extends: Jii.base.Object,

	__static: {

		/**
		 * The followings are the supported abstract column data types.
		 */
		TYPE_PK: 'pk',
		TYPE_BIGPK: 'bigpk',
		TYPE_STRING: 'string',
		TYPE_TEXT: 'text',
		TYPE_SMALLINT: 'smallint',
		TYPE_INTEGER: 'integer',
		TYPE_BIGINT: 'bigint',
		TYPE_FLOAT: 'float',
		TYPE_DECIMAL: 'decimal',
		TYPE_DATETIME: 'datetime',
		TYPE_TIMESTAMP: 'timestamp',
		TYPE_TIME: 'time',
		TYPE_DATE: 'date',
		TYPE_BINARY: 'binary',
		TYPE_BOOLEAN: 'boolean',
		TYPE_MONEY: 'money'

	},

	/**
	 * @type {Jii.data.sql.Connection} the database connection
	 */
	db: null,

	/**
	 * @var string the default schema name used for the current session.
	 */
	defaultSchema: null,

	/**
	 * @var array list of ALL table names in the database
	 */
	_tableNames: null,

	/**
	 * @var array list of loaded table metadata (table name: TableSchema)
	 */
	_tables: null,

	/**
	 * @var QueryBuilder the query builder for this database
	 */
	_builder: null,

	constructor: function () {
		this._tables = {};
		this._tableNames = {};

		this.__super.apply(this, arguments);
	},

	/**
	 * Loads the metadata for the specified table.
	 * @param {string} name table name
	 * @return {Jii.data.sql.TableSchema} DBMS-dependent table metadata, null if the table does not exist.
	 */
	_loadTableSchema: function (name) {
		throw new Jii.exceptions.NotSupportedException('Not implemented');
	},

	/**
	 * Obtains the metadata for the named table.
	 * @param {string} name table name. The table name may contain schema name if any. Do not quote the table name.
	 * @param {boolean} [refresh] whether to reload the table schema even if it is found in the cache.
	 * @return TableSchema table metadata. Null if the named table does not exist.
	 */
	getTableSchema: function (name, refresh) {
		refresh = refresh || false;

		if (_.has(this._tables, name) && !refresh) {
			return Promise.resolve(this._tables[name]);
		}

		var db = this.db;
		var realName = this.getRawTableName(name);

		/*if (db.enableSchemaCache && !in_array(name, db.schemaCacheExclude, true)) {

		 cache = is_string(db.schemaCache) ? Yii::app.get(db.schemaCache, false) : db.schemaCache;
		 if (cache instanceof Cache) {
		 key = this.getCacheKey(name);
		 if (refresh || (table = cache.get(key)) === false) {
		 this._tables[name] = table = this._loadTableSchema(realName);
		 if (table !== null) {
		 cache.set(key, table, db.schemaCacheDuration, new GroupDependency([
		 'group': this.getCacheGroup(),
		 ]));
		 }
		 } else {
		 this._tables[name] = table;
		 }

		 return this._tables[name];
		 }
		 }*/

		return this._loadTableSchema(realName).then(function(table) {
			this._tables[name] = table;
			return this._tables[name];
		}.bind(this));

	},

	/**
	 * Returns the cache key for the specified table name.
	 * @param {string} name the table name
	 * @return mixed the cache key
	 */
	/*_getCacheKey: function(name) {
	 return [
	 __CLASS__,
	 this.db.dsn,
	 this.db.username,
	 name,
	 ];
	 },*/

	/**
	 * Returns the cache group name.
	 * This allows [[refresh()]] to invalidate all cached table schemas.
	 * @return string the cache group name
	 */
	/*_getCacheGroup: function()
	 {
	 return md5(serialize([
	 __CLASS__,
	 this.db.dsn,
	 this.db.username,
	 ]));
	 },*/

	/**
	 * Returns the metadata for all tables in the database.
	 * @param {string} [schema] the schema of the tables. Defaults to empty string, meaning the current or default schema name.
	 * @param {boolean} [refresh] whether to fetch the latest available table schemas. If this is false,
	 * cached data may be returned if available.
	 * @return {Promise} the metadata for all tables in the database.
	 * Each array element is an instance of [[TableSchema]] or its child class.
	 */
	getTableSchemas: function (schema, refresh) {
		schema = schema || '';
		refresh = refresh || false;

		return this.getTableNames(schema, refresh).then(function(tableNames) {
			var tables = [];
			var promises = [];

			_.each(tableNames, function (name) {
				if (schema !== '') {
					name = schema + '.' + name;
				}

				var promise = this.getTableSchema(name, refresh).then(function(table) {
					if (table !== null) {
						tables.push(table);
					}
					return Promise.resolve();
				});
				promises.push(promise);
			}.bind(this));

			return Promise.all(promises).then(function() {
				return tables;
			});
		}.bind(this)).catch(Jii.catchHandler());

	},

	/**
	 * Returns all table names in the database.
	 * @param {string} [schema] the schema of the tables. Defaults to empty string, meaning the current or default schema name.
	 * If not empty, the returned table names will be prefixed with the schema name.
	 * @param {boolean} [refresh] whether to fetch the latest available table names. If this is false,
	 * table names fetched previously (if available) will be returned.
	 * @return {Promise} all table names in the database.
	 */
	getTableNames: function (schema, refresh) {
		schema = schema || '';
		refresh = refresh || false;

		if (_.has(this._tableNames, schema) && !refresh) {
			return Promise.resolve(this._tableNames[schema]);
		}

		return this._findTableNames(schema).then(function(tableNames) {
			this._tableNames[schema] = tableNames;
			return this._tableNames[schema];
		}.bind(this)).catch(Jii.catchHandler());
	},

	/**
	 * @return {Jii.data.sql.QueryBuilder} the query builder for this connection.
	 */
	getQueryBuilder: function () {
		if (this._builder === null) {
			this._builder = this.createQueryBuilder();
		}

		return this._builder;
	},

	/**
	 * Determines the PDO type for the given PHP data value.
	 * @param mixed data the data whose PDO type is to be determined
	 * @return integer the PDO type
	 * @see http://www.php.net/manual/en/pdo.constants.php
	 */
	/*getPdoType: function(data)
	 {
	 static typeMap = [
	 // php type: PDO type
	 'boolean': \PDO::PARAM_BOOL,
	 'integer': \PDO::PARAM_INT,
	 'string': \PDO::PARAM_STR,
	 'resource': \PDO::PARAM_LOB,
	 'NULL': \PDO::PARAM_NULL,
	 ];
	 type = gettype(data);

	 return isset(typeMap[type]) ? typeMap[type] : \PDO::PARAM_STR;
	 },*/

	/**
	 * Refreshes the schema.
	 * This method cleans up all cached table schemas so that they can be re-created later
	 * to reflect the database schema change.
	 */
	refresh: function () {
		/** @var Cache cache */
		/*cache = is_string(this.db.schemaCache) ? Yii::app.get(this.db.schemaCache, false) : this.db.schemaCache;
		 if (this.db.enableSchemaCache && cache instanceof Cache) {
		 GroupDependency::invalidate(cache, this.getCacheGroup());
		 }*/
		this._tableNames = {};
		this._tables = {};
	},

	/**
	 * Creates a query builder for the database.
	 * This method may be overridden by child classes to create a DBMS-specific query builder.
	 * @return {Jii.data.sql.QueryBuilder} query builder instance
	 */
	createQueryBuilder: function () {
		return new Jii.data.sql.QueryBuilder(this.db);
	},

	/**
	 * Returns all table names in the database.
	 * This method should be overridden by child classes in order to support this feature
	 * because the default implementation simply throws an exception.
	 * @param {string} [schema] the schema of the tables. Defaults to empty string, meaning the current or default schema.
	 * @return array all table names in the database. The names have NO schema name prefix.
	 * @throws NotSupportedException if this method is called
	 */
	_findTableNames: function (schema) {
		throw new Jii.exceptions.NotSupportedException(this.className() + ' does not support fetching all table names.');
	},

	/**
	 * Returns all unique indexes for the given table.
	 * Each array element is of the following structure:
	 *
	 * ~~~
	 * {
	 *  IndexName1: ['col1' [, ...]],
	 *  IndexName2: ['col2' [, ...]],
	 * }
	 * ~~~
	 *
	 * This method should be overridden by child classes in order to support this feature
	 * because the default implementation simply throws an exception
	 * @param {Jii.data.sql.TableSchema} table the table metadata
	 * @return {[]} all unique indexes for the given table.
	 * @throws NotSupportedException if this method is called
	 */
	findUniqueIndexes: function (table) {
		throw new Jii.exceptions.NotSupportedException(this.className() + ' does not support getting unique indexes information.');
	},

	/**
	 * Returns the ID of the last inserted row or sequence value.
	 * @param {string} [sequenceName] name of the sequence object (required by some DBMS)
	 * @return string the row ID of the last row inserted, or the last value retrieved from the sequence object
	 * @throws InvalidCallException if the DB connection is not active
	 * @see http://www.php.net/manual/en/function.PDO-lastInsertId.php
	 */
	getLastInsertID: function (sequenceName) {
		sequenceName = sequenceName || '';

		/*if (this.db.isActive) {
		 return this.db.pdo.lastInsertId(sequenceName);
		 } else {
		 throw new InvalidCallException('DB Connection is not active.');
		 }*/
	},

	/**
	 * @return boolean whether this DBMS supports [savepoint](http://en.wikipedia.org/wiki/Savepoint).
	 */
	/*supportsSavepoint: function() {
	 return this.db.enableSavepoint;
	 },*/

	/**
	 * Creates a new savepoint.
	 * @param string name the savepoint name
	 */
	/*createSavepoint: function(name)
	 {
	 this.db.createCommand("SAVEPOINT name").execute();
	 },*/

	/**
	 * Releases an existing savepoint.
	 * @param string name the savepoint name
	 */
	/*releaseSavepoint: function(name)
	 {
	 this.db.createCommand("RELEASE SAVEPOINT name").execute();
	 },*/

	/**
	 * Rolls back to a previously created savepoint.
	 * @param string name the savepoint name
	 */
	/*rollBackSavepoint: function(name)
	 {
	 this.db.createCommand("ROLLBACK TO SAVEPOINT name").execute();
	 },*/

	/**
	 * Quotes a string value for use in a query.
	 * @param {string} str string to be quoted
	 * @return {string} the properly quoted string
	 */
	quoteValue: function (str) {
		if (_.isUndefined(str) || str === null) {
			return 'NULL';
		}

		switch (typeof str) {
			case 'boolean':
				return (str) ? 'true' : 'false';

			case 'number':
				return str+'';

			case 'string':
				str = str.replace(/[\0\n\r\b\t\\'"\x1a]/g, function(s) {
					switch(s) {
						case "\0": return "\\0";
						case "\n": return "\\n";
						case "\r": return "\\r";
						case "\b": return "\\b";
						case "\t": return "\\t";
						case "\x1a": return "\\Z";
						default: return "\\"+s;
					}
				});
				return "'"+str+"'";
		}

		throw new Jii.exceptions.NotSupportedException('BaseSchema.quote() not support `' + typeof str + '` value: ' + str);
	},

	/**
	 * Quotes a table name for use in a query.
	 * If the table name contains schema prefix, the prefix will also be properly quoted.
	 * If the table name is already quoted or contains '(' or '{{',
     * then this method will do nothing.
     * @param {string} name table name
	 * @return {string} the properly quoted table name
	 */
	quoteTableName: function (name) {
		if (name.indexOf('(') !== -1 || name.indexOf('{{') !== -1) {
			return name;
		}

		if (name.indexOf('.') === -1) {
			return this.quoteSimpleTableName(name);
		}

		var parts = name.split('.');
		_.each(parts, function (part, i) {
			parts[i] = this.quoteSimpleTableName(part);
		}.bind(this));

		return parts.join('.');

	},

	/**
	 * Quotes a column name for use in a query.
	 * If the column name contains prefix, the prefix will also be properly quoted.
	 * If the column name is already quoted or contains '(', '[[' or '{{',
     * then this method will do nothing.
     * @param {string} name column name
	 * @return {string} the properly quoted column name
	 * @see quoteSimpleColumnName()
	 */
	quoteColumnName: function (name) {
		if (name.indexOf('(') !== -1 || name.indexOf('[[') !== -1 || name.indexOf('{{') !== -1) {
			return name;
		}

		var prefix = '';
		var pos = name.lastIndexOf('.');
		if (pos !== -1) {
			prefix = this.quoteTableName(name.substr(0, pos)) + '.';
			name = name.substr(pos + 1);
		}

		return prefix + this.quoteSimpleColumnName(name);
	},

	/**
	 * Quotes a simple table name for use in a query.
	 * A simple table name should contain the table name only without any schema prefix.
	 * If the table name is already quoted, this method will do nothing.
	 * @param {string} name table name
	 * @return {string} the properly quoted table name
	 */
	quoteSimpleTableName: function (name) {
		return name.indexOf("'") !== -1 ? name : "'" + name + "'";
	},

	/**
	 * Quotes a simple column name for use in a query.
	 * A simple column name should contain the column name only without any prefix.
	 * If the column name is already quoted or is the asterisk character '*', this method will do nothing.
	 * @param {string} name column name
	 * @return {string} the properly quoted column name
	 */
	quoteSimpleColumnName: function (name) {
		return name.indexOf("'") !== -1 || name === '*' ? name : '"' + name + '"';
	},

	/**
	 * Returns the actual name of a given table name.
	 * This method will strip off curly brackets from the given table name
	 * and replace the percentage character '%' with [[Connection::tablePrefix]].
	 * @param {string} name the table name to be converted
	 * @return {string} the real name of the given table name
	 */
	getRawTableName: function (name) {
		if (name.indexOf('{{') !== -1) {
			name = name.replace(/\\{\\{(.*?)\\}\\}/g, '$1');
			name = name.replace(/%/g, this.db.tablePrefix);
		}

		return name;
	},

	/**
	 * Extracts the JS type from abstract DB type.
	 * @param {Jii.data.sql.ColumnSchema} column the column schema information
	 * @return {string} JS type name
	 */
	_getColumnJsType: function (column) {
		switch (column.type) {
			case this.__static.TYPE_SMALLINT:
			case this.__static.TYPE_INTEGER:
				return column.unsigned ? 'string' : 'number';

			case this.__static.TYPE_BOOLEAN:
				return 'boolean';

			case this.__static.TYPE_FLOAT:
				return 'number';
		}

		return 'string';
	}

	/**
	 * Handles database error
	 *
	 * @param \Exception e
	 * @param string rawSql SQL that produced exception
	 * @throws Exception
	 */
	/*handleException: function(\Exception e, rawSql)
	 {
	 if (e instanceof Exception) {
	 throw e;
	 } else {
	 exceptionClass = '\yii\db\Exception';
	 foreach (this.exceptionMap as error: class) {
	 if (strpos(e.getMessage(), error) !== false) {
	 exceptionClass = class;
	 }
	 }

	 message = e.getMessage()  . "\nThe SQL being executed was: rawSql";
	 errorInfo = e instanceof \PDOException ? e.errorInfo : null;
	 throw new exceptionClass(message, errorInfo, (int) e.getCode(), e);
	 }
	 }*/

});
