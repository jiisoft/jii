/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const NotSupportedException = require('../exceptions/NotSupportedException');
const QueryBuilder = require('./QueryBuilder');
const FilterBuilder = require('../data/FilterBuilder');
const ColumnSchemaBuilder = require('./ColumnSchemaBuilder');
const _isUndefined = require('lodash/isUndefined');
const _each = require('lodash/each');
const _has = require('lodash/has');
const BaseObject = require('../base/BaseObject');
const ColumnSchema = require('./ColumnSchema');

class BaseSchema extends BaseObject {

    preInit() {
        /**
         * @type {Jii.data.FilterBuilder}
         */
        this._filterBuilder = null;

        /**
         * @type {Jii.data.QueryBuilder}
         */
        this._builder = null;

        /**
         * @var array list of loaded table metadata (table name: TableSchema)
         */
        this._tables = {};

        /**
         * @var array list of ALL table names in the database
         */
        this._tableNames = {};

        /**
         * @var string the default schema name used for the current session.
         */
        this.defaultSchema = null;

        /**
         * @type {Jii.sql.Connection} the database connection
         */
        this.db = null;

        super.preInit(...arguments);
    }

    getTableSchema(name) {
        name = this.getRawTableName(name);
        return this._tables[name] || null;
    }

    /**
     * Returns the metadata for all tables in the database.
     * @param {string} [schema] the schema of the tables. Defaults to empty string, meaning the current or default schema name.
     * @param {boolean} [refresh] whether to fetch the latest available table schemas. If this is false,
     * cached data may be returned if available.
     * @return {Promise} the metadata for all tables in the database.
     * Each array element is an instance of [[TableSchema]] or its child class.
     */
    loadTableSchemas(schema, refresh) {
        schema = schema || '';
        refresh = refresh || false;

        return this.loadTableNames(schema, refresh).then(tableNames => {
            var tables = [];
            var promises = [];

            _each(tableNames, name => {
                if (schema !== '') {
                    name = schema + '.' + name;
                }

                var promise = this.loadTableSchema(name, refresh).then(table => {
                    if (table !== null) {
                        tables.push(table);
                    }
                    return Promise.resolve();
                });
                promises.push(promise);
            });

            return Promise.all(promises).then(() => {
                return tables;
            });
        });
    }

    getTableNames() {
        return this._tableNames[''];
    }

    /**
     * Returns all table names in the database.
     * @param {string} [schema] the schema of the tables. Defaults to empty string, meaning the current or default schema name.
     * If not empty, the returned table names will be prefixed with the schema name.
     * @param {boolean} [refresh] whether to fetch the latest available table names. If this is false,
     * table names fetched previously (if available) will be returned.
     * @return {Promise} all table names in the database.
     */
    loadTableNames(schema, refresh) {
        schema = schema || '';
        refresh = refresh || false;

        if (_has(this._tableNames, schema) && !refresh) {
            return Promise.resolve(this._tableNames[schema]);
        }

        return this._findTableNames(schema).then(tableNames => {
            this._tableNames[schema] = tableNames;
            return this._tableNames[schema];
        });
    }

    /**
     * Obtains the metadata for the named table.
     * @param {string} name table name. The table name may contain schema name if any. Do not quote the table name.
     * @param {boolean} [refresh] whether to reload the table schema even if it is found in the cache.
     * @return TableSchema table metadata. Null if the named table does not exist.
     */
    loadTableSchema(name, refresh) {
        refresh = refresh || false;

        if (_has(this._tables, name) && !refresh) {
            return Promise.resolve(this._tables[name]);
        }

        var realName = this.getRawTableName(name);

        return this._loadTableSchema(realName).then(table => {
            this._tables[name] = table;
            return this._tables[name];
        });
    }

    /**
     * Loads the metadata for the specified table.
     * @param {string} name table name
     * @return {Jii.data.TableSchema} DBMS-dependent table metadata, null if the table does not exist.
     */
    _loadTableSchema(name) {
        throw new NotSupportedException('Not implemented');
    }

    /**
     * @return {Jii.data.QueryBuilder} the query builder for this connection.
     */
    getQueryBuilder() {
        if (this._builder === null) {
            this._builder = this.createQueryBuilder();
        }

        return this._builder;
    }

    /**
     * @return {Jii.data.FilterBuilder} the query builder for this connection.
     */
    getFilterBuilder() {
        if (this._filterBuilder === null) {
            this._filterBuilder = this.createFilterBuilder();
        }

        return this._filterBuilder;
    }

    /**
     * Refreshes the schema.
     * This method cleans up all cached table schemas so that they can be re-created later
     * to reflect the database schema change.
     */
    refresh() {
        /** @var Cache cache */
        this._tableNames = {};
        this._tables = {};

        return this.loadTableSchemas();
    }

    /**
     * Creates a query builder for the database.
     * This method may be overridden by child classes to create a DBMS-specific query builder.
     * @return {Jii.data.QueryBuilder} query builder instance
     */
    createQueryBuilder() {
        return new QueryBuilder(this.db);
    }

    /**
     * @return {Jii.data.FilterBuilder}
     */
    createFilterBuilder() {
        return new FilterBuilder();
    }

    /**
     * Create a column schema builder instance giving the type and value precision.
     *
     * This method may be overridden by child classes to create a DBMS-specific column schema builder.
     *
     * @param {string} type type of the column. See [[ColumnSchemaBuilder.type]].
     * @param {number|string|[]} length length or precision of the column. See [[ColumnSchemaBuilder.length]].
     * @returns {Jii.data.ColumnSchemaBuilder} column schema builder instance
     * @since 2.0.6
     */
    createColumnSchemaBuilder(type, length) {
        length = length || null;

        return new ColumnSchemaBuilder(type, length);
    }

    /**
     * @return {Jii.data.ColumnSchema}
     */
    _createColumnSchema() {
        return Jii.createObject(ColumnSchema);
    }

    /**
     * Returns all table names in the database.
     * This method should be overridden by child classes in order to support this feature
     * because the default implementation simply throws an exception.
     * @param {string} [schema] the schema of the tables. Defaults to empty string, meaning the current or default schema.
     * @return array all table names in the database. The names have NO schema name prefix.
     * @throws NotSupportedException if this method is called
     */
    _findTableNames(schema) {
        throw new NotSupportedException(this.className() + ' does not support fetching all table names.');
    }

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
     * @param {Jii.data.TableSchema} table the table metadata
     * @return {[]} all unique indexes for the given table.
     * @throws NotSupportedException if this method is called
     */
    findUniqueIndexes(table) {
        throw new NotSupportedException(this.className() + ' does not support getting unique indexes information.');
    }

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
    quoteValue(str) {
        if (_isUndefined(str) || str === null) {
            return 'NULL';
        }

        switch (typeof str) {
            case 'boolean':
                return str ? 'true' : 'false';

            case 'number':
                return str + '';

            case 'string':
                str = str.replace(/[\n\r\b\t\\'"\x1a]/g, s => {
                    switch (s) {
                        case '\0':
                            return '\\0';
                        case '\n':
                            return '\\n';
                        case '\r':
                            return '\\r';
                        case '\b':
                            return '\\b';
                        case '\t':
                            return '\\t';
                        case '\x1A':
                            return '\\Z';
                        default:
                            return '\\' + s;
                    }
                });
                return '\'' + str + '\'';
        }

        throw new NotSupportedException('BaseSchema.quote() not support `' + typeof str + '` value: ' + str);
    }

    /**
     * Quotes a table name for use in a query.
     * If the table name contains schema prefix, the prefix will also be properly quoted.
     * If the table name is already quoted or contains '(' or '{{',
     * then this method will do nothing.
     * @param {string} name table name
     * @return {string} the properly quoted table name
     */
    quoteTableName(name) {
        if (name.indexOf('(') !== -1 || name.indexOf('{{') !== -1) {
            return name;
        }

        if (name.indexOf('.') === -1) {
            return this.quoteSimpleTableName(name);
        }

        var parts = name.split('.');
        _each(parts, (part, i) => {
            parts[i] = this.quoteSimpleTableName(part);
        });

        return parts.join('.');
    }

    /**
     * Quotes a column name for use in a query.
     * If the column name contains prefix, the prefix will also be properly quoted.
     * If the column name is already quoted or contains '(', '[[' or '{{',
     * then this method will do nothing.
     * @param {string} name column name
     * @return {string} the properly quoted column name
     * @see quoteSimpleColumnName()
     */
    quoteColumnName(name) {
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
    }

    /**
     * Quotes a simple table name for use in a query.
     * A simple table name should contain the table name only without any schema prefix.
     * If the table name is already quoted, this method will do nothing.
     * @param {string} name table name
     * @return {string} the properly quoted table name
     */
    quoteSimpleTableName(name) {
        return name.indexOf('\'') !== -1 ? name : '\'' + name + '\'';
    }

    /**
     * Quotes a simple column name for use in a query.
     * A simple column name should contain the column name only without any prefix.
     * If the column name is already quoted or is the asterisk character '*', this method will do nothing.
     * @param {string} name column name
     * @return {string} the properly quoted column name
     */
    quoteSimpleColumnName(name) {
        return name.indexOf('\'') !== -1 || name === '*' ? name : '"' + name + '"';
    }

    /**
     * Returns the actual name of a given table name.
     * This method will strip off curly brackets from the given table name
     * and replace the percentage character '%' with [[Connection::tablePrefix]].
     * @param {string} name the table name to be converted
     * @return {string} the real name of the given table name
     */
    getRawTableName(name) {
        if (name.indexOf('{{') !== -1) {
            name = name.replace(/\{\{(.*?)\}\}/g, '$1');
            name = name.replace(/%/g, this.db.tablePrefix);
        }

        return name;
    }

    /**
     * Extracts the JS type from abstract DB type.
     * @param {Jii.data.ColumnSchema} column the column schema information
     * @return {string} JS type name
     */
    _getColumnJsType(column) {
        switch (column.type) {
            case BaseSchema.TYPE_SMALLINT:
            case BaseSchema.TYPE_INTEGER:
                return column.unsigned ? 'string' : 'number';

            case BaseSchema.TYPE_BOOLEAN:
                return 'boolean';

            case BaseSchema.TYPE_FLOAT:
            case BaseSchema.TYPE_DECIMAL:
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
}
BaseSchema.TYPE_MONEY = 'money';
BaseSchema.TYPE_BOOLEAN = 'boolean';
BaseSchema.TYPE_BINARY = 'binary';
BaseSchema.TYPE_DATE = 'date';
BaseSchema.TYPE_TIME = 'time';
BaseSchema.TYPE_TIMESTAMP = 'timestamp';
BaseSchema.TYPE_DATETIME = 'datetime';
BaseSchema.TYPE_DECIMAL = 'decimal';
BaseSchema.TYPE_DOUBLE = 'double';
BaseSchema.TYPE_FLOAT = 'float';
BaseSchema.TYPE_BIGINT = 'bigint';
BaseSchema.TYPE_INTEGER = 'integer';
BaseSchema.TYPE_SMALLINT = 'smallint';
BaseSchema.TYPE_TEXT = 'text';
BaseSchema.TYPE_STRING = 'string';
BaseSchema.TYPE_BIGPK = 'bigpk';

/**
 * The followings are the supported abstract column data types.
 */
BaseSchema.TYPE_PK = 'pk';
module.exports = BaseSchema;