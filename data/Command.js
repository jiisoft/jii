/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const _isEmpty = require('lodash/isEmpty');
const _each = require('lodash/each');
const _has = require('lodash/has');
const _extend = require('lodash/extend');
const Component = require('../base/Component');

class Command extends Component {

    preInit() {
        /**
         * @type {string} the SQL statement that this command represents
         */
        this._sql = null;

        /**
         * @type {object} the parameters (name => value) that are bound to the current PDO statement.
         * This property is maintained by methods such as [[bindValue()]].
         * Do not modify it directly.
         */
        this.params = null;

        /**
         * @type {BaseConnection} the DB connection that this command is associated with
         */
        this.db = null;

        super.preInit(...arguments);
    }

    /**
     * Returns the SQL statement for this command.
     * @returns {string} the SQL statement to be executed
     */
    getSql() {
        return this._sql;
    }

    /**
     * Specifies the SQL statement to be executed.
     * @param {string} sql the SQL statement to be set.
     * @returns {static} this command instance
     */
    setSql(sql) {
        if (this._sql !== sql) {
            this._sql = this.db.quoteSql(sql);
            this.params = {};
        }

        return this;
    }

    /**
     * Returns the raw SQL by inserting parameter values into the corresponding placeholders in [[sql]].
     * Note that the return value of this method should mainly be used for logging purpose.
     * It is likely that this method returns an invalid SQL due to improper replacement of parameter placeholders.
     * @returns {string} the raw SQL with parameter values inserted into the corresponding placeholders in [[sql]].
     */
    getRawSql() {
        if (_isEmpty(this.params)) {
            return this._sql;
        }

        // Quote values
        var params = {};
        _each(this.params, (value, name) => {
            params[name] = this.db.quoteValue(value);
        });

        // Format `key = ?`
        if (_has(params, 1)) {
            var sql = '';
            _each(this._sql.split('?'), (part, i) => {
                sql += (params[i] || '') + part;
            });
            return sql;
        }

        // Format `:name = 'John'`
        var sql2 = this._sql;
        _each(Object.keys(params).sort().reverse(), name => {
            sql2 = sql2.replace(new RegExp(name.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'), 'g'), params[name]);
        });
        return sql2;
    }

    /**
     * Binds a value to a parameter.
     * @param {string|number} name Parameter identifier. For a prepared statement
     * using named placeholders, this will be a parameter name of
     * the form `:name`. For a prepared statement using question mark
     * placeholders, this will be the 1-indexed position of the parameter.
     * @param {*} value The value to bind to the parameter
     * @returns {static} the current command being executed
     */
    bindValue(name, value) {
        this.params[name] = value;
        return this;
    }

    /**
     * Binds a list of values to the corresponding parameters.
     * This is similar to [[bindValue()]] except that it binds multiple values at a time.
     * Note that the SQL data type of each value is determined by its PHP type.
     * @param {object} values the values to be bound. This must be given in terms of an associative
     * array with array keys being the parameter names, and array values the corresponding parameter values,
     * e.g. `{':name': 'John', ':age': 25}`.
     * @returns {static} the current command being executed
     */
    bindValues(values) {
        _extend(this.params, values);
        return this;
    }

    /**
     * Executes the SQL statement.
     * This method should only be used for executing non-query SQL statement, such as `INSERT`, `DELETE`, `UPDATE` SQLs.
     * No result set will be returned.
     * @returns {Promise.<number>} number of rows affected by the execution.
     * @throws Exception execution failed
     */
    execute() {
        var sql = this.getSql();
        var rawSql = this.getRawSql();

        //Jii.info(rawSql, __METHOD__);

        if (!sql) {
            return Promise.resolve(0);
        }

        //var token = rawSql;
        //Jii.beginProfile(token, __METHOD__);
        return this.db.exec(rawSql, 'execute').then(result => {
            //Jii.endProfile(token, __METHOD__);

            return result;
        }, exception => {

            //Jii.endProfile(token, __METHOD__);
            //$this->db->getSchema()->handleException($e, $rawSql);

            return Promise.reject(exception, rawSql);
        });
    }

    /**
     * Executes the SQL statement and returns query result.
     * This method is for executing a SQL query that returns result set, such as `SELECT`.
     * @returns {Promise} the reader object for fetching the query result
     * @throws Exception execution failed
     */
    query() {
    }

    /**
     * Executes the SQL statement and returns ALL rows at once.
     * @returns {Promise} all rows of the query result. Each array element is an array representing a row of data.
     * An empty array is returned if the query results in nothing.
     * @throws Exception execution failed
     */
    queryAll() {
        return this._queryInternal('all');
    }

    /**
     * Executes the SQL statement and returns the first row of the result.
     * This method is best used when only the first row of result is needed for a query.
     * @returns {Promise} the first row (in terms of an array) of the query result. False is returned if the query
     * results in nothing.
     * @throws Exception execution failed
     */
    queryOne() {
        return this._queryInternal('one');
    }

    /**
     * Executes the SQL statement and returns the value of the first column in the first row of data.
     * This method is best used when only a single value is needed for a query.
     * @returns {Promise} the value of the first column in the first row of the query result.
     * False is returned if there is no value.
     * @throws Exception execution failed
     */
    queryScalar() {
        return this._queryInternal('scalar');
    }

    /**
     * Executes the SQL statement and returns the first column of the result.
     * This method is best used when only the first column of result (i.e. the first element in each row)
     * is needed for a query.
     * @returns {Promise} the first column of the query result. Empty array is returned if the query results in nothing.
     * @throws Exception execution failed
     */
    queryColumn() {
        return this._queryInternal('column');
    }

    /**
     * Performs the actual DB query of a SQL statement.
     * @param {string} method
     * @returns {Promise} the method execution result
     * @throws Exception if the query causes any problem
     */
    _queryInternal(method) {
        var rawSql = this.getRawSql();

        //Jii.info(rawSql, 'query');

        //var token = rawSql;
        //Jii.beginProfile(token, 'query');
        return this.db.exec(rawSql, method).then(result => {
            //Jii.endProfile(token, __METHOD__);

            return result;
        }, exception => {
            //Jii.endProfile(token, 'query');
            //$this->db->getSchema()->handleException($e, $rawSql);

            return Promise.reject(exception, rawSql);
        });
    }

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
     *
     *
     * @param {string} table the table that new rows() will be inserted into.
     * @param {object} columns the column data (name => value) to be inserted into the table.
     * @returns {static} the command object itself
     */
    insert(table, columns) {
        var params = {};

        return this.db.getQueryBuilder().insert(table, columns, params).then(sql => {
            this.setSql(sql);
            this.bindValues(params);

            return this.execute();
        });
    }

    /**
     *
     * @param {ActiveRecord} model
     * @param {object} values
     * @returns {static}
     */
    insertModel(model, values) {
        return this.insert(model.constructor.tableName(), values);
    }

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
    batchInsert(table, columns, rows) {
        return this.db.getQueryBuilder().batchInsert(table, columns, rows).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

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
     *
     *
     * @param {string} table the table to be updated.
     * @param {object} columns the column data (name => value) to be updated.
     * @param {string|[]} [condition] the condition that will be put in the WHERE part. Please
     * refer to [[Query.where()]] on how to specify condition.
     * @param {object} [params] the parameters to be bound to the command
     * @returns {static} the command object itself
     */
    update(table, columns, condition, params) {
        condition = condition || '';
        params = params || {};

        return this.db.getQueryBuilder().update(table, columns, condition, params).then(sql => {

            this.setSql(sql);
            this.bindValues(params);

            return this.execute();
        });
    }

    /**
     *
     * @param {BaseActiveRecord} model
     * @param {object} values
     * @returns {static}
     */
    updateModel(model, values) {
        var condition = model.getOldPrimaryKey(true);
        return this.update(model.constructor.tableName(), values, condition);
    }

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
     *
     *
     * @param {string} table the table where the data will be deleted from.
     * @param {string|[]} [condition] the condition that will be put in the WHERE part. Please
     * refer to [[Query.where()]] on how to specify condition.
     * @param {object} [params] the parameters to be bound to the command
     * @returns {static} the command object itself
     */
    delete(table, condition, params) {
        condition = condition || '';
        params = params || {};

        return this.db.getQueryBuilder().delete(table, condition, params).then(sql => {
            this.setSql(sql);
            this.bindValues(params);
            return this.execute();
        });
    }

    /**
     *
     * @param {BaseActiveRecord} model
     * @returns {static}
     */
    deleteModel(model) {
        var condition = model.getOldPrimaryKey(true);
        return this.delete(model.constructor.tableName(), condition);
    }

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
    createTable(table, columns, options) {
        options = options || null;

        return this.db.getQueryBuilder().createTable(table, columns, options).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

    /**
     * Creates a SQL command for renaming a DB table.
     * @param {string} table the table to be renamed. The name will be properly quoted by the method.
     * @param {string} newName the new table() name. The name will be properly quoted by the method.
     * @returns {static} the command object itself
     */
    renameTable(table, newName) {
        return this.db.getQueryBuilder().renameTable(table, newName).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

    /**
     * Creates a SQL command for dropping a DB table.
     * @param {string} table the table to be dropped. The name will be properly quoted by the method.
     * @returns {static} the command object itself
     */
    dropTable(table) {
        return this.db.getQueryBuilder().dropTable(table).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

    /**
     * Creates a SQL command for truncating a DB table.
     * @param {string} table the table to be truncated. The name will be properly quoted by the method.
     * @returns {static} the command object itself
     */
    truncateTable(table) {
        return this.db.getQueryBuilder().truncateTable(table).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

    /**
     * Creates a SQL command for adding a new DB() column.
     * @param {string} table the table that the new column() will be added to. The table name will be properly quoted by the method.
     * @param {string} column the name of the new column.() The name will be properly quoted by the method.
     * @param {string} type the column type. [[\getColumnType()]] will be called
     * to convert the give column type to the physical one. For example, `string` will be converted
     * as `varchar(255)`, and `string not null` becomes `varchar(255) not null`.
     * @returns {static} the command object itself
     */
    addColumn(table, column, type) {
        return this.db.getQueryBuilder().addColumn(table, column, type).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

    /**
     * Creates a SQL command for dropping a DB column.
     * @param {string} table the table whose column is to be dropped. The name will be properly quoted by the method.
     * @param {string} column the name of the column to be dropped. The name will be properly quoted by the method.
     * @returns {static} the command object itself
     */
    dropColumn(table, column) {
        return this.db.getQueryBuilder().dropColumn(table, column).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

    /**
     * Creates a SQL command for renaming a column.
     * @param {string} table the table whose column is to be renamed. The name will be properly quoted by the method.
     * @param {string} oldName the old name of the column. The name will be properly quoted by the method.
     * @param {string} newName the new name() of the column. The name will be properly quoted by the method.
     * @returns {static} the command object itself
     */
    renameColumn(table, oldName, newName) {
        return this.db.getQueryBuilder().renameColumn(table, oldName, newName).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

    /**
     * Creates a SQL command for changing the definition of a column.
     * @param {string} table the table whose column is to be changed. The table name will be properly quoted by the method.
     * @param {string} column the name of the column to be changed. The name will be properly quoted by the method.
     * @param {string} type the column type. [[\getColumnType()]] will be called
     * to convert the give column type to the physical one. For example, `string` will be converted
     * as `varchar(255)`, and `string not null` becomes `varchar(255) not null`.
     * @returns {static} the command object itself
     */
    alterColumn(table, column, type) {
        return this.db.getQueryBuilder().alterColumn(table, column, type).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

    /**
     * Creates a SQL command for adding a primary key constraint to an existing table.
     * The method will properly quote the table and column names.
     * @param {string} name the name of the primary key constraint.
     * @param {string} table the table that the primary key constraint will be added to.
     * @param {string|[]} columns comma separated string or array of columns that the primary key will consist of.
     * @returns {static} the command object itself.
     */
    addPrimaryKey(name, table, columns) {
        return this.db.getQueryBuilder().addPrimaryKey(name, table, columns).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

    /**
     * Creates a SQL command for removing a primary key constraint to an existing table.
     * @param {string} name the name of the primary key constraint to be removed.
     * @param {string} table the table that the primary key constraint will be removed from.
     * @returns {static} the command object itself
     */
    dropPrimaryKey(name, table) {
        return this.db.getQueryBuilder().dropPrimaryKey(name, table).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

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
    addForeignKey(name, table, columns, refTable, refColumns, deleteOption, updateOption) {
        deleteOption = deleteOption || null;
        updateOption = updateOption || null;

        return this.db.getQueryBuilder().addForeignKey(name, table, columns, refTable, refColumns, deleteOption, updateOption).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

    /**
     * Creates a SQL command for dropping a foreign key constraint.
     * @param {string} name the name of the foreign key constraint to be dropped. The name will be properly quoted by the method.
     * @param {string} table the table whose foreign is to be dropped. The name will be properly quoted by the method.
     * @returns {static} the command object itself
     */
    dropForeignKey(name, table) {
        return this.db.getQueryBuilder().dropForeignKey(name, table).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

    /**
     * Creates a SQL command for creating a new index.()
     * @param {string} name the name of the index. The name will be properly quoted by the method.
     * @param {string} table the table that the new index() will be created for. The table name will be properly quoted by the method.
     * @param {string|[]} columns the column(s) that should be included in the index. If there are multiple columns, please separate them
     * by commas. The column names will be properly quoted by the method.
     * @param {boolean} [unique] whether to add UNIQUE constraint on the created index.
     * @returns {static} the command object itself
     */
    createIndex(name, table, columns, unique) {
        unique = unique || false;

        return this.db.getQueryBuilder().createIndex(name, table, columns, unique).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

    /**
     * Creates a SQL command for dropping an index.
     * @param {string} name the name of the index to be dropped. The name will be properly quoted by the method.
     * @param {string} table the table whose index is to be dropped. The name will be properly quoted by the method.
     * @returns {static} the command object itself
     */
    dropIndex(name, table) {
        return this.db.getQueryBuilder().dropIndex(name, table).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

    /**
     * Creates a SQL command for resetting the sequence value of a table's primary key.
     * The sequence will be reset such that the primary key of the next new row() inserted
     * will have the specified value or 1.
     * @param {string} table the name of the table whose primary key sequence will be reset
     * @param {*} [value] the value for the primary key of the next new row() inserted. If this is not set,
     * the next new row()'s primary key will have a value 1.
     * @returns {static} the command object itself
     * @throws NotSupportedException if this is not supported by the underlying DBMS
     */
    resetSequence(table, value) {
        value = value || null;

        return this.db.getQueryBuilder().resetSequence(table, value).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

    /**
     * Builds a SQL command for enabling or disabling integrity check.
     * @param {boolean} check whether to turn on or off the integrity check.
     * @param {string} schema the schema name of the tables. Defaults to empty string, meaning the current
     * or default schema.
     * @param {string} table the table name.
     * @returns {static} the command object itself
     * @throws NotSupportedException if this is not supported by the underlying DBMS
     */
    checkIntegrity(check, schema, table) {
        check = check || true;
        schema = schema || '';
        table = table || '';

        return this.db.getQueryBuilder().checkIntegrity(check, schema, table).then(sql => {
            this.setSql(sql);
            return this.execute();
        });
    }

}
module.exports = Command;