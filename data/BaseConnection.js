
'use strict';

var Jii = require('../BaseJii');
var ApplicationException = require('../exceptions/ApplicationException');
var Command = require('./Command');
var _isString = require('lodash/isString');
var _isFunction = require('lodash/isFunction');
var _each = require('lodash/each');
var Component = require('../base/Component');

/**
 * The following example shows how to create a Connection instance and establish
 * the DB connection:
 *
 * ~~~
 * connection = new \jii.data.sql.Connection({
 *     dsn: dsn,
 *     username: username,
 *     password: password,
 * });
 * connection.open();
 * ~~~
 *
 * After the DB connection is established, one can execute SQL statements like the following:
 *
 * ~~~
 * command = connection.createCommand('SELECT * FROM post');
 * posts = command.queryAll();
 * command = connection.createCommand('UPDATE post SET status=1');
 * command.execute();
 * ~~~
 *
 * One can also do prepared SQL execution and bind parameters to the prepared SQL.
 * When the parameters are coming from user input, you should use this approach
 * to prevent SQL injection attacks. The following is an example:
 *
 * ~~~
 * command = connection.createCommand('SELECT * FROM post WHERE id=:id');
 * command.bindValue(':id', _GET['id']);
 * post = command.query();
 * ~~~
 *
 * For more information about how to perform various DB queries, please refer to [[Command]].
 *
 * If the underlying DBMS supports transactions, you can perform transactional SQL queries
 * like the following:
 *
 * ~~~
 * transaction = connection.beginTransaction();
 * try {
 *     connection.createCommand(sql1).execute();
 *     connection.createCommand(sql2).execute();
 *     // ... executing other SQL statements ...
 *     transaction.commit();
 * } catch (Exception e) {
 *     transaction.rollBack();
 * }
 * ~~~
 *
 * Connection is often used as an application component and configured in the application
 * configuration like the following:
 *
 * ~~~
 * 'components' => {
 *     db: [
 *         class: '\jii.data.sql.Connection',
 *         dsn: 'mysql:host=127.0.0.1;dbname=demo',
 *         username: 'root',
 *         password: '',
 *         charset: 'utf8',
 *     ],
 * },
 * ~~~
 *
 * @property string driverName Name of the DB driver.
 * @property boolean isActive Whether the DB connection is established. This property is read-only.
 * @property string lastInsertID The row ID of the last row inserted, or the last value retrieved from the
 * sequence object. This property is read-only.
 * @property QueryBuilder queryBuilder The query builder for the current DB connection. This property is
 * read-only.
 * @property Schema schema The schema information for the database opened by this connection. This property
 * is read-only.
 * @property Transaction transaction The currently active transaction. Null if no active transaction. This
 * property is read-only.
 *
 * @class Jii.data.BaseConnection
 * @extends Jii.base.Component
 */
var BaseConnection = Jii.defineClass('Jii.data.BaseConnection', /** @lends Jii.data.BaseConnection.prototype */{

	__extends: Component,

	__static: /** @lends Jii.data.BaseConnection */{
		/**
		 * @event Event an event that is triggered after a DB connection is established
		 */
		EVENT_AFTER_OPEN: 'afterOpen'
	},

	/**
	 * @type {string} the username for establishing DB connection. Defaults to `null` meaning no username to use.
	 */
	username: null,

	/**
	 * @type {string} the password for establishing DB connection. Defaults to `null` meaning no password to use.
	 */
	password: null,

	/**
	 * @type {string} the charset used for database connection. The property is only used
	 * for MySQL, PostgreSQL and CUBRID databases. Defaults to null, meaning using default charset
	 * as specified by the database.
	 *
	 * Note that if you're using GBK or BIG5 then it's highly recommended to
	 * specify charset via DSN like 'mysql:dbname=mydatabase;host=127.0.0.1;charset=GBK;'.
	 */
	charset: null,

	/**
	 * @type {string} the common prefix or suffix for table names. If a table name is given
	 * as `{{%TableName}}`, then the percentage character `%` will be replaced with this
	 * property value. For example, `{{%post}}` becomes `{{tbl_post}}`.
	 */
	tablePrefix: '',

	/**
	 * @type {string|object}
	 */
	schemaClass: '',

	/**
	 * @type {string}
	 */
	driverName: '',

	/**
	 * @type {Jii.data.BaseSchema} the database schema
	 */
	_schema: null,

	/**
	 * @type {boolean}
	 */
	_isOpen: false,

	/**
	 * Returns a value indicating whether the DB connection is established.
	 * @returns {boolean} whether the DB connection is established
	 */
	getIsActive() {
		return this._isOpen;
	},

    /**
     * @deprecated
     */
    open() {
        return this.start();
    },

    /**
     * @deprecated
     */
    close() {
        return this.stop();
    },

	/**
	 * Establishes a DB connection.
	 * It does nothing if a DB connection has already been established.
	 * @throws Exception if connection fails
	 */
	start() {
		if (this._isOpen) {
			return;
		}
		this._isOpen = true;

		this._initConnection();

		// Load all table schemas in default database
		return this.getSchema().loadTableSchemas();
	},

	/**
	 * Closes the currently active DB connection.
	 * It does nothing if the connection is already closed.
	 */
	stop() {
		if (this._isOpen) {
			this._isOpen = false;
			this._schema = null;

			this._closeConnection();
		}
	},

	/**
	 * Initializes the DB connection.
	 * This method is invoked right after the DB connection is established.
	 * if [[emulatePrepare]] is true, and sets the database [[charset]] if it is not empty.
	 * It then triggers an [[EVENT_AFTER_OPEN]] event.
	 * @protected
	 */
	_initConnection() {
		//this.trigger(this.__static.EVENT_AFTER_OPEN);
	},

	/**
	 * @protected
	 */
	_closeConnection() {
	},

	/**
	 * Creates a command for execution.
	 * @param {string} [sql] the SQL statement to be executed
	 * @param {object} [params] the parameters to be bound to the SQL statement
	 * @returns {static} the DB command
	 */
	createCommand(sql, params) {
		sql = sql || null;
		params = params || [];

		if (!this._isOpen) {
			throw new ApplicationException('Database connection is not opened. Use open() method before send queries.');
		}

		this.open();
		var command = new Command({
			db: this,
			sql: sql
		});

		return command.bindValues(params);
	},

	/**
	 * Returns the schema information for the database opened by this connection.
	 * @returns {Jii.data.BaseSchema} the schema information for the database opened by this connection.
	 */
	getSchema() {
		if (this._schema === null) {
			var config = _isString(this.schemaClass) || _isFunction(this.schemaClass) ?
				{ className: this.schemaClass } :
				this.schemaClass;
			config.db = this;

			this._schema = Jii.createObject(config);
		}
		return this._schema;
	},

	/**
	 * Returns the query builder for the current DB connection.
	 * @returns {Jii.data.QueryBuilder} the query builder for the current DB connection.
	 */
	getQueryBuilder() {
		return this.getSchema().getQueryBuilder();
	},

	/**
	 * Obtains the schema information for the named table.
	 * @param {string} name table name.
	 * @returns {*} table schema information. Null if the named table does not exist.
	 */
	getTableSchema(name) {
		return this.getSchema().getTableSchema(name);
	},

    /**
     *
     * @param {string[]} tableNames
     * @returns {{}}
     */
    getModelSchemaJson(tableNames) {
        tableNames = tableNames || [];

        var obj = {};
        _each(tableNames, name => {
            obj[name] = this.getTableSchema(name).toJSON();
        });
        return obj;
    },

	/**
	 * Quotes a string value for use in a query.
	 * Note that if the parameter is not a string, it will be returned without change.
	 * @param {string} str string to be quoted
	 * @returns {string} the properly quoted string
	 * @see http://www.php.net/manual/en/function.PDO-quote.php
	 */
	quoteValue(str) {
		return this.getSchema().quoteValue(str);
	},

	/**
	 * Quotes a table name for use in a query.
	 * If the table name contains schema prefix, the prefix will also be properly quoted.
	 * If the table name is already quoted or contains special characters including '(', '[[' and '{{',
     * then this method will do nothing.
     * @param {string} name table name
	 * @returns {string} the properly quoted table name
	 */
	quoteTableName(name) {
		return this.getSchema().quoteTableName(name);
	},

	/**
	 * Quotes a column name for use in a query.
	 * If the column name contains prefix, the prefix will also be properly quoted.
	 * If the column name is already quoted or contains special characters including '(', '[[' and '{{',
     * then this method will do nothing.
     * @param {string} name column name
	 * @returns {string} the properly quoted column name
	 */
	quoteColumnName(name) {
		return this.getSchema().quoteColumnName(name);
	},

	/**
	 * Processes a SQL statement by quoting table and column names that are enclosed within double brackets.
	 * Tokens enclosed within double curly brackets are treated as table names, while
	 * tokens enclosed within double square brackets are column names. They will be quoted accordingly.
	 * Also, the percentage character "%" at the beginning or ending of a table name will be replaced
	 * with [[tablePrefix]].
	 * @param {string} sql the SQL to be quoted
	 * @returns {string} the quoted SQL
	 */
	quoteSql(sql) {
		return sql.replace(/\{\{(%?[\w\-\. ]+%?)\}\}|\[\[([\w\-\. ]+)\]\]/g, (match, tableName, columnName) => {
			if (columnName) {
				return this.quoteColumnName(columnName);
			}
			return this.quoteTableName(tableName.replace(/%/g, this.tablePrefix));
		});
	},

    /**
     *
     * @param modelClassName
     * @returns {Jii.base.Collection|null}
     */
    getRootCollection(modelClassName) {
        return null;
    },

	/**
	 * Returns the name of the DB driver. Based on the the current [[dsn]], in case it was not set explicitly
	 * by an end user.
	 * @returns {string} name of the DB driver
	 */
	getDriverName() {
		return this._driverName;
	},

	/**
	 * Changes the current driver name.
	 * @param {string} driverName name of the DB driver
	 */
	setDriverName(driverName) {
		this._driverName = driverName.toLowerCase();
	},

	/**
	 *
	 * @param {string} sql
	 * @param {string} [method]
	 */
	exec(sql, method) {
		method = method || null;


	}

});

module.exports = BaseConnection;