/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const NotSupportedException = require('../exceptions/NotSupportedException');
const InvalidConfigException = require('../exceptions/InvalidConfigException');
const InvalidParamException = require('../exceptions/InvalidParamException');
const Expression = require('../data/Expression');
const Query = require('../data/Query');
const _isArray = require('lodash/isArray');
const _isString = require('lodash/isString');
const _isBoolean = require('lodash/isBoolean');
const _isEmpty = require('lodash/isEmpty');
const _isObject = require('lodash/isObject');
const _isNaN = require('lodash/isNaN');
const _extend = require('lodash/extend');
const _filter = require('lodash/filter');
const _each = require('lodash/each');
const _size = require('lodash/size');
const _has = require('lodash/has');
const _map = require('lodash/map');
const _clone = require('lodash/clone');
const _values = require('lodash/values');
const _words = require('lodash/words');
const _trim = require('lodash/trim');
const _trimStart = require('lodash/trimStart');
const BaseObject = require('../base/BaseObject');

class QueryBuilder extends BaseObject {

    preInit(connection, config) {
        config = config || {};

        /**
         * @var array map of query condition to builder methods.
         * These methods are used by [[buildCondition]] to build SQL conditions from array syntax.
         */
        this._conditionBuilders = {
            'NOT': 'buildNotCondition',
            'AND': 'buildAndCondition',
            'OR': 'buildAndCondition',
            'BETWEEN': 'buildBetweenCondition',
            'NOT BETWEEN': 'buildBetweenCondition',
            'IN': 'buildInCondition',
            'NOT IN': 'buildInCondition',
            'LIKE': 'buildLikeCondition',
            'NOT LIKE': 'buildLikeCondition',
            'OR LIKE': 'buildLikeCondition',
            'OR NOT LIKE': 'buildLikeCondition',
            'EXISTS': 'buildExistsCondition',
            'NOT EXISTS': 'buildExistsCondition'
        };

        /**
         * @var array the abstract column types mapped to physical column types.
         * This is mainly used to support creating/modifying tables using DB-independent data type specifications.
         * Child classes should override this property to declare supported type mappings.
         */
        this.typeMap = null;

        /**
         * @var string the separator between different fragments of a SQL statement.
         * Defaults to an empty space. This is mainly used by [[build()]] when generating a SQL statement.
         */
        this.separator = ' ';

        /**
         * @var Connection the database connection.
         */
        this.db = connection;

        super.preInit(config);
    }

    /**
     * Generates a SELECT SQL statement from a [[Query]] object.
     * @param {Query} query the [[Query]] object from which the SQL statement will be generated.
     * @param {object} [params] the parameters to be bound to the generated SQL statement. These parameters will
     * be included in the result with the additional parameters generated during the query building process.
     * @return {[]} the generated SQL statement (the first array element) and the corresponding
     * parameters to be bound to the SQL statement (the second array element). The parameters returned
     * include those provided in `params`.
     */
    build(query, params) {
        params = params || {};

        return query.prepare(this).then(query => {
            params = _extend(params, query.getParams());
            return Promise.all([
                this.buildSelect(query.getSelect(), params, query.getDistinct(), query.getSelectOption()),
                this.buildFrom(query.getFrom(), params),
                this.buildJoin(query.getJoin(), params),
                this.buildWhere(query.getWhere(), params),
                this.buildGroupBy(query.getGroupBy()),
                this.buildHaving(query.getHaving(), params),
                this.buildOrderBy(query.getOrderBy()),
                this.buildLimit(query.getLimit(), query.getOffset())
            ]).then(clauses => {
                clauses = _filter(clauses, sqlPart => {
                    return !!sqlPart;
                });

                var sql = clauses.join(this.separator);

                return this.buildUnion(query.getUnion(), params).then(union => {
                    if (union !== '') {
                        sql = '(' + sql + ')' + this.separator + union;
                    }

                    return [
                        sql,
                        params
                    ];
                });
            });
        });
    }

    /**
     * Creates an INSERT SQL statement.
     * For example,
     *
     * ~~~
     * sql = queryBuilder.insert('user', {
     *  name: 'Sam',
     *  age: 30
     * }, params);
     * ~~~
     *
     * The method will properly escape the table and column names.
     *
     * @param {string} table the table that new rows will be inserted into.
     * @param {object} columns the column data (name: value) to be inserted into the table.
     * @param {object} params the binding parameters that will be generated by this method.
     * They should be bound to the DB command later.
     * @return string the INSERT SQL
     */
    insert(table, columns, params) {
        var tableSchema = this.db.getTableSchema(table);
        var columnSchemas = tableSchema !== null ? tableSchema.columns : {};
        var names = [];
        var placeholders = [];

        _each(columns, (value, name) => {
            names.push(this.db.quoteColumnName(name));

            if (value instanceof Expression) {
                placeholders.push(value.expression);
                params = _extend(params, value.params);
            } else {
                var phName = QueryBuilder.PARAM_PREFIX + _size(params);

                placeholders.push(phName);
                params[phName] = !_isArray(value) && _has(columnSchemas, name) ? columnSchemas[name].typecast(value) : value;
            }
        });

        return Promise.resolve('INSERT INTO ' + this.db.quoteTableName(table) + ' (' + names.join(', ') + ') VALUES (' + placeholders.join(', ') + ')');
    }

    /**
     * Generates a batch INSERT SQL statement.
     * For example,
     *
     * ~~~
     * sql = queryBuilder.batchInsert('user', ['name', 'age'], {
     *     ['Tom', 30],
     *     ['Jane', 20],
     *     ['Linda', 25]
     * });
     * ~~~
     *
     * Note that the values in each row must match the corresponding column names.
     *
     * @param {string} table the table that new rows will be inserted into.
     * @param {string[]} columns the column names
     * @param {*[]} rows the rows to be batch inserted into the table
     * @return {string} the batch INSERT SQL statement
     */
    batchInsert(table, columns, rows) {
        var tableSchema = this.db.getTableSchema(table);
        var columnSchemas = tableSchema !== null ? tableSchema.columns : [];
        var values = [];

        _each(rows, row => {
            var rowValues = [];

            _each(row, (value, i) => {
                if (!_isArray(value) && _has(columnSchemas, columns[i])) {
                    value = columnSchemas[columns[i]].typecast(value);
                }

                if (_isString(value)) {
                    value = this.db.quoteValue(value);
                } else if (value === false) {
                    value = 0;
                } else if (value === null) {
                    value = 'NULL';
                }

                rowValues.push(value);
            });

            values.push('(' + rowValues.join(', ') + ')');
        });

        _each(columns, (name, i) => {
            columns[i] = this.db.quoteColumnName(name);
        });

        return Promise.resolve('INSERT INTO ' + this.db.quoteTableName(table) + ' (' + columns.join(', ') + ') VALUES ' + values.join(', '));
    }

    /**
     * Creates an UPDATE SQL statement.
     * For example,
     *
     * ~~~
     * params = [];
     * sql = queryBuilder.update('user', {status: 1}, 'age > 30', params);
     * ~~~
     *
     * The method will properly escape the table and column names.
     *
     * @param {string} table the table to be updated.
     * @param {object} columns the column data (name: value) to be updated.
     * @param {object|[]|string} condition the condition that will be put in the WHERE part. Please
     * refer to [[Query::where()]] on how to specify condition.
     * @param {object} params the binding parameters that will be modified by this method
     * so that they can be bound to the DB command later.
     * @return {string} the UPDATE SQL
     */
    update(table, columns, condition, params) {
        var tableSchema = this.db.getTableSchema(table);
        var columnSchemas = tableSchema !== null ? tableSchema.columns : {};
        var lines = [];

        _each(columns, (value, name) => {
            if (value instanceof Expression) {
                lines.push(this.db.quoteColumnName(name) + '=' + value.expression);
                _each(value.params, (v, n) => {
                    params[n] = v;
                });
            } else {
                var phName = QueryBuilder.PARAM_PREFIX + _size(params);

                lines.push(this.db.quoteColumnName(name) + '=' + phName);
                params[phName] = !_isArray(value) && _has(columnSchemas, name) ? columnSchemas[name].typecast(value) : value;
            }
        });

        var sql = 'UPDATE ' + this.db.quoteTableName(table) + ' SET ' + lines.join(', ');

        return this.buildWhere(condition, params).then(where => {
            return where === '' ? sql : sql + ' ' + where;
        });
    }

    /**
     * Creates a DELETE SQL statement.
     * For example,
     *
     * ~~~
     * sql = queryBuilder.delete('user', 'status = 0');
     * ~~~
     *
     * The method will properly escape the table and column names.
     *
     * @param {string} table the table where the data will be deleted from.
     * @param {object|[]|string} condition the condition that will be put in the WHERE part. Please
     * refer to [[Query::where()]] on how to specify condition.
     * @param {object} params the binding parameters that will be modified by this method
     * so that they can be bound to the DB command later.
     * @return {string} the DELETE SQL
     */
    delete(table, condition, params) {
        var sql = 'DELETE FROM ' + this.db.quoteTableName(table);
        return this.buildWhere(condition, params).then(where => {
            return where === '' ? sql : sql + ' ' + where;
        });
    }

    /**
     * Builds a SQL statement for creating a new DB table.
     *
     * The columns in the new  table should be specified as name-definition pairs (e.g. 'name': 'string'),
     * where name stands for a column name which will be properly quoted by the method, and definition
     * stands for the column type which can contain an abstract DB type.
     * The [[getColumnType()]] method will be invoked to convert any abstract type into a physical one.
     *
     * If a column is specified with definition only (e.g. 'PRIMARY KEY (name, type)'), it will be directly
     * inserted into the generated SQL.
     *
     * For example,
     *
     * ~~~
     * sql = queryBuilder.createTable('user', [
     *  'id': 'pk',
     *  'name': 'string',
     *  'age': 'integer',
     * ]);
     * ~~~
     *
     * @param {string} table the name of the table to be created. The name will be properly quoted by the method.
     * @param {object} columns the columns (name: definition) in the new table.
     * @param {string} [options] additional SQL fragment that will be appended to the generated SQL.
     * @return {string} the SQL statement for creating a new DB table.
     */
    createTable(table, columns, options) {
        options = options || null;

        var cols = [];
        _each(columns, (type, name) => {
            if (_isString(name)) {
                cols.push('\t' + this.db.quoteColumnName(name) + ' ' + this.getColumnType(type));
            } else {
                cols.push('\t' + type);
            }
        });

        var sql = 'CREATE TABLE ' + this.db.quoteTableName(table) + ' (\n' + cols.join(',\n') + '\n)';
        return Promise.resolve(options === null ? sql : sql + ' ' + options);
    }

    /**
     * Builds a SQL statement for renaming a DB table.
     * @param {string} oldName the table to be renamed. The name will be properly quoted by the method.
     * @param {string} newName the new table name. The name will be properly quoted by the method.
     * @return {string} the SQL statement for renaming a DB table.
     */
    renameTable(oldName, newName) {
        return Promise.resolve('RENAME TABLE ' + this.db.quoteTableName(oldName) + ' TO ' + this.db.quoteTableName(newName));
    }

    /**
     * Builds a SQL statement for dropping a DB table.
     * @param {string} table the table to be dropped. The name will be properly quoted by the method.
     * @return {string} the SQL statement for dropping a DB table.
     */
    dropTable(table) {
        return Promise.resolve('DROP TABLE ' + this.db.quoteTableName(table));
    }

    /**
     * Builds a SQL statement for adding a primary key constraint to an existing table.
     * @param {string} name the name of the primary key constraint.
     * @param {string} table the table that the primary key constraint will be added to.
     * @param {string|[]} columns comma separated string or array of columns that the primary key will consist of.
     * @return {string} the SQL statement for adding a primary key constraint to an existing table.
     */
    addPrimaryKey(name, table, columns) {
        if (_isString(columns)) {
            columns = _words(columns, /[^,]+/g);
        }

        columns = _map(columns, col => {
            return this.db.quoteColumnName(col);
        });

        return Promise.resolve('ALTER TABLE ' + this.db.quoteTableName(table) + ' ADD CONSTRAINT ' + this.db.quoteColumnName(name) + '  PRIMARY KEY (' + columns.join(', ') + ' )');
    }

    /**
     * Builds a SQL statement for removing a primary key constraint to an existing table.
     * @param {string} name the name of the primary key constraint to be removed.
     * @param {string} table the table that the primary key constraint will be removed from.
     * @return {string} the SQL statement for removing a primary key constraint from an existing table.
     */
    dropPrimaryKey(name, table) {
        return Promise.resolve('ALTER TABLE ' + this.db.quoteTableName(table) + ' DROP CONSTRAINT ' + this.db.quoteColumnName(name));
    }

    /**
     * Builds a SQL statement for truncating a DB table.
     * @param {string} table the table to be truncated. The name will be properly quoted by the method.
     * @return {string} the SQL statement for truncating a DB table.
     */
    truncateTable(table) {
        return Promise.resolve('TRUNCATE TABLE ' + this.db.quoteTableName(table));
    }

    /**
     * Builds a SQL statement for adding a new DB column.
     * @param {string} table the table that the new column will be added to. The table name will be properly quoted by the method.
     * @param {string} column the name of the new column. The name will be properly quoted by the method.
     * @param {string} type the column type. The [[getColumnType()]] method will be invoked to convert abstract column type (if any)
     * into the physical one. Anything that is not recognized as abstract type will be kept in the generated SQL.
     * For example, 'string' will be turned into 'varchar(255)', while 'string not null' will become 'varchar(255) not null'.
     * @return {string} the SQL statement for adding a new column.
     */
    addColumn(table, column, type) {
        return Promise.resolve('ALTER TABLE ' + this.db.quoteTableName(table) + ' ADD ' + this.db.quoteColumnName(column) + ' ' + this.getColumnType(type));
    }

    /**
     * Builds a SQL statement for dropping a DB column.
     * @param {string} table the table whose column is to be dropped. The name will be properly quoted by the method.
     * @param {string} column the name of the column to be dropped. The name will be properly quoted by the method.
     * @return {string} the SQL statement for dropping a DB column.
     */
    dropColumn(table, column) {
        return Promise.resolve('ALTER TABLE ' + this.db.quoteTableName(table) + ' DROP COLUMN ' + this.db.quoteColumnName(column));
    }

    /**
     * Builds a SQL statement for renaming a column.
     * @param {string} table the table whose column is to be renamed. The name will be properly quoted by the method.
     * @param {string} oldName the old name of the column. The name will be properly quoted by the method.
     * @param {string} newName the new name of the column. The name will be properly quoted by the method.
     * @return {string} the SQL statement for renaming a DB column.
     */
    renameColumn(table, oldName, newName) {
        return Promise.resolve('ALTER TABLE ' + this.db.quoteTableName(table) + ' RENAME COLUMN ' + this.db.quoteColumnName(oldName) + ' TO ' + this.db.quoteColumnName(newName));
    }

    /**
     * Builds a SQL statement for changing the definition of a column.
     * @param {string} table the table whose column is to be changed. The table name will be properly quoted by the method.
     * @param {string} column the name of the column to be changed. The name will be properly quoted by the method.
     * @param {string} type the new column type. The [[getColumnType()]] method will be invoked to convert abstract
     * column type (if any) into the physical one. Anything that is not recognized as abstract type will be kept
     * in the generated SQL. For example, 'string' will be turned into 'varchar(255)', while 'string not null'
     * will become 'varchar(255) not null'.
     * @return {string} the SQL statement for changing the definition of a column.
     */
    alterColumn(table, column, type) {
        return Promise.resolve('ALTER TABLE ' + this.db.quoteTableName(table) + ' CHANGE ' + this.db.quoteColumnName(column) + ' ' + this.db.quoteColumnName(column) + ' ' + this.getColumnType(type));
    }

    /**
     * Builds a SQL statement for adding a foreign key constraint to an existing table.
     * The method will properly quote the table and column names.
     * @param {string} name the name of the foreign key constraint.
     * @param {string} table the table that the foreign key constraint will be added to.
     * @param {string|string[]} columns the name of the column to that the constraint will be added on.
     * If there are multiple columns, separate them with commas or use an array to represent them.
     * @param {string} refTable the table that the foreign key references to.
     * @param {string|string[]} refColumns the name of the column that the foreign key references to.
     * If there are multiple columns, separate them with commas or use an array to represent them.
     * @param {string} [deleteOption] the ON DELETE option. Most DBMS support these options: RESTRICT, CASCADE, NO ACTION, SET DEFAULT, SET NULL
     * @param {string} [updateOption] the ON UPDATE option. Most DBMS support these options: RESTRICT, CASCADE, NO ACTION, SET DEFAULT, SET NULL
     * @return string the SQL statement for adding a foreign key constraint to an existing table.
     */
    addForeignKey(name, table, columns, refTable, refColumns, deleteOption, updateOption) {
        deleteOption = deleteOption || null;
        updateOption = updateOption || null;

        var sql = 'ALTER TABLE ' + this.db.quoteTableName(table) + ' ADD CONSTRAINT ' + this.db.quoteColumnName(name) + ' FOREIGN KEY (' + this.buildColumns(columns) + ')' + ' REFERENCES ' + this.db.quoteTableName(refTable) + ' (' + this.buildColumns(refColumns) + ')';
        if (deleteOption !== null) {
            sql += ' ON DELETE ' + deleteOption;
        }
        if (updateOption !== null) {
            sql += ' ON UPDATE ' + updateOption;
        }

        return Promise.resolve(sql);
    }

    /**
     * Builds a SQL statement for dropping a foreign key constraint.
     * @param {string} name the name of the foreign key constraint to be dropped. The name will be properly quoted by the method.
     * @param {string} table the table whose foreign is to be dropped. The name will be properly quoted by the method.
     * @return {string} the SQL statement for dropping a foreign key constraint.
     */
    dropForeignKey(name, table) {
        return Promise.resolve('ALTER TABLE ' + this.db.quoteTableName(table) + ' DROP CONSTRAINT ' + this.db.quoteColumnName(name));
    }

    /**
     * Builds a SQL statement for creating a new index.
     * @param {string} name the name of the index. The name will be properly quoted by the method.
     * @param {string} table the table that the new index will be created for. The table name will be properly quoted by the method.
     * @param {string|string[]} columns the column(s) that should be included in the index. If there are multiple columns,
     * separate them with commas or use an array to represent them. Each column name will be properly quoted
     * by the method, unless a parenthesis is found in the name.
     * @param {boolean} isUnique whether to add UNIQUE constraint on the created index.
     * @return {string} the SQL statement for creating a new index.
     */
    createIndex(name, table, columns, isUnique) {
        isUnique = isUnique || false;

        return Promise.resolve((isUnique ? 'CREATE UNIQUE INDEX ' : 'CREATE INDEX ') + this.db.quoteTableName(name) + ' ON ' + this.db.quoteTableName(table) + ' (' + this.buildColumns(columns) + ')');
    }

    /**
     * Builds a SQL statement for dropping an index.
     * @param {string} name the name of the index to be dropped. The name will be properly quoted by the method.
     * @param {string} table the table whose index is to be dropped. The name will be properly quoted by the method.
     * @return {string} the SQL statement for dropping an index.
     */
    dropIndex(name, table) {
        return Promise.resolve('DROP INDEX ' + this.db.quoteTableName(name) + ' ON ' + this.db.quoteTableName(table));
    }

    /**
     * Creates a SQL statement for resetting the sequence value of a table's primary key.
     * The sequence will be reset such that the primary key of the next new row inserted
     * will have the specified value or 1.
     * @param {string} table the name of the table whose primary key sequence will be reset
     * @param {[]|string} value the value for the primary key of the next new row inserted. If this is not set,
     * the next new row's primary key will have a value 1.
     * @return {string} the SQL statement for resetting sequence
     * @throws NotSupportedException if this is not supported by the underlying DBMS
     */
    resetSequence(table, value) {
        value = value || null;
        throw new NotSupportedException(this.db.getDriverName() + ' does not support resetting sequence.');
    }

    /**
     * Builds a SQL statement for enabling or disabling integrity check.
     * @param {boolean} check whether to turn on or off the integrity check.
     * @param {string} schema the schema of the tables. Defaults to empty string, meaning the current or default schema.
     * @param {string} table the table name. Defaults to empty string, meaning that no table will be changed.
     * @return {string} the SQL statement for checking integrity
     * @throws NotSupportedException if this is not supported by the underlying DBMS
     */
    checkIntegrity(check, schema, table) {
        check = _isBoolean(check) ? check : true;
        schema = schema || '';
        table = table || '';

        throw new NotSupportedException(this.db.getDriverName() + ' does not support enabling/disabling integrity check.');
    }

    /**
     * Converts an abstract column type into a physical column type.
     * The conversion is done using the type map specified in [[typeMap]].
     * The following abstract column types are supported (using MySQL as an example to explain the corresponding
     * physical types):
     *
     * - `pk`: an auto-incremental primary key type, will be converted into "int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY"
     * - `bigpk`: an auto-incremental primary key type, will be converted into "bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY"
     * - `string`: string type, will be converted into "varchar(255)"
     * - `text`: a long string type, will be converted into "text"
     * - `smallint`: a small integer type, will be converted into "smallint(6)"
     * - `integer`: integer type, will be converted into "int(11)"
     * - `bigint`: a big integer type, will be converted into "bigint(20)"
     * - `boolean`: boolean type, will be converted into "tinyint(1)"
     * - `float``: float number type, will be converted into "float"
     * - `decimal`: decimal number type, will be converted into "decimal"
     * - `datetime`: datetime type, will be converted into "datetime"
     * - `timestamp`: timestamp type, will be converted into "timestamp"
     * - `time`: time type, will be converted into "time"
     * - `date`: date type, will be converted into "date"
     * - `money`: money type, will be converted into "decimal(19,4)"
     * - `binary`: binary data type, will be converted into "blob"
     *
     * If the abstract type contains two or more parts separated by spaces (e.g. "string NOT NULL"), then only
     * the first part will be converted, and the rest of the parts will be appended to the converted result.
     * For example, 'string NOT NULL' is converted to 'varchar(255) NOT NULL'.
     *
     * For some of the abstract types you can also specify a length or precision constraint
     * by appending it in round brackets directly to the type.
     * For example `string(32)` will be converted into "varchar(32)" on a MySQL database.
     * If the underlying DBMS does not support these kind of constraints for a type it will
     * be ignored.
     *
     * If a type cannot be found in [[typeMap]], it will be returned without any change.
     * @param {string} type abstract column type
     * @return {string} physical column type.
     */
    getColumnType(type) {
        if (_has(this.typeMap, type)) {
            return this.typeMap[type];
        }

        var matches = /^(\w+)\((.+?)\)(.*)/.exec(type);
        if (matches !== null) {
            if (_has(this.typeMap, matches[1])) {
                return this.typeMap[matches[1]].replace(/\(.+\)/, '(' + matches[2] + ')') + matches[3];
            }
        } else {
            var matches2 = /^(\w+)\s+/.exec(type);
            if (matches2 !== null && _has(this.typeMap, matches2[1])) {
                return type.replace(/^\w+/, this.typeMap[matches2[1]]);
            }
        }

        return type;
    }

    /**
     * @param {object} columns
     * @param {object} params the binding parameters to be populated
     * @param {boolean} distinct
     * @param {string} selectOption
     * @return {string} the SELECT clause built from [[Query::select]].
     */
    buildSelect(columns, params, distinct, selectOption) {
        distinct = distinct || false;
        selectOption = selectOption || null;

        var select = distinct ? 'SELECT DISTINCT' : 'SELECT';
        if (selectOption !== null) {
            select += ' ' + selectOption;
        }

        if (_isEmpty(columns)) {
            return Promise.resolve(select + ' *');
        }

        var normalizeColumns = [];
        var promises = [];
        _each(columns, (column, i) => {
            if (column instanceof Expression) {
                normalizeColumns.push(column.expression);
                params = _extend(params, column.params);
            } else if (column instanceof Query) {
                var promise = this.build(column, params).then(buildParams => {
                    var sql = buildParams[0];

                    normalizeColumns.push('(' + sql + ') AS ' + this.db.quoteColumnName(i));
                });
                promises.push(promise);
            } else if (!/^[0-9]+$/.test(i)) {
                if (column.indexOf('(') === -1) {
                    column = this.db.quoteColumnName(column);
                }
                normalizeColumns.push(column + ' AS ' + this.db.quoteColumnName(i));
            } else if (column.indexOf('(') === -1) {
                var matches = /^(.*?)(?:\s+as\s+|\s+)([\w\-_\.]+)/i.exec(column);
                if (matches !== null) {
                    normalizeColumns.push(this.db.quoteColumnName(matches[1]) + ' AS ' + this.db.quoteColumnName(matches[2]));
                } else {
                    normalizeColumns.push(this.db.quoteColumnName(column));
                }
            } else {
                normalizeColumns.push(column);
            }
        });

        return Promise.all(promises).then(() => {
            return select + ' ' + normalizeColumns.join(', ');
        });
    }

    /**
     * @param {object|[]} tables
     * @param {object} params the binding parameters to be populated
     * @return {string} the FROM clause built from [[Query::from]].
     */
    buildFrom(tables, params) {
        if (_isEmpty(tables)) {
            return Promise.resolve('');
        }

        return this._quoteTableNames(tables, params).then(tables => {
            return 'FROM ' + tables.join(', ');
        });
    }

    /**
     * @param {[]} joins
     * @param {object} params the binding parameters to be populated
     * @return string the JOIN clause built from [[Query::join]].
     * @throws Exception if the joins parameter is not in proper format
     */
    buildJoin(joins, params) {
        if (_isEmpty(joins)) {
            return Promise.resolve('');
        }

        var promises = [];
        joins = _clone(joins);

        _each(joins, (join, i) => {
            if (!_isArray(join) || join.length < 1) {
                throw new InvalidConfigException('A join clause must be specified as an array of join type, join table, and optionally join condition.');
            }

            // 0:join type, 1:join table, 2:on-condition (optional)
            var joinType = join[0];
            var table = join[1];
            if (!_isArray(table) && !_isObject(table)) {
                table = [table];
            }

            var promise = this._quoteTableNames(table, params).then(tables => {
                table = _values(tables)[0];

                joins[i] = joinType + ' ' + table;

                if (join[2]) {
                    return this.buildCondition(join[2], params).then(condition => {

                        if (condition !== '') {
                            joins[i] += ' ON ' + condition;
                        }
                    });
                }
            });
            promises.push(promise);
        });

        return Promise.all(promises).then(() => {
            return joins.join(this.separator);
        });
    }

    /**
     *
     * @param {object|[]} tables
     * @param {object} params
     * @returns {object|[]}
     * @private
     */
    _quoteTableNames(tables, params) {
        var promises = [];

        _each(tables, (table, i) => {
            if (table instanceof Query) {

                var promise = this.build(table, params).then(buildResult => {
                    var sql = buildResult[0];

                    params = _extend(params, buildResult[1]);
                    tables[i] = '(' + sql + ') ' + this.db.quoteTableName(i);
                });
                promises.push(promise);
            } else if (_isString(i)) {
                if (table.indexOf('(') === -1) {
                    table = this.db.quoteTableName(table);
                }
                tables[i] = table + ' ' + this.db.quoteTableName(i);
            } else if (table.indexOf('(') === -1) {
                var matches = /^(.*?)(?:\s+as|)\s+([^ ]+)/i.exec(table);
                if (matches !== null) {
                    // with alias
                    tables[i] = this.db.quoteTableName(matches[1]) + ' ' + this.db.quoteTableName(matches[2]);
                } else {
                    tables[i] = this.db.quoteTableName(table);
                }
            }
        });

        return Promise.all(promises).then(() => {
            return _isObject(tables) ? _values(tables) : tables;
        });
    }

    /**
     * @param {string|object} condition
     * @param {object} params the binding parameters to be populated
     * @return {string} the WHERE clause built from [[Query::where]].
     */
    buildWhere(condition, params) {
        return this.buildCondition(condition, params).then(where => {
            return Promise.resolve(where === '' ? '' : 'WHERE ' + where);
        });
    }

    /**
     * @param {string[]} columns
     * @return {string} the GROUP BY clause
     */
    buildGroupBy(columns) {
        return Promise.resolve(_isEmpty(columns) ? '' : 'GROUP BY ' + this.buildColumns(columns));
    }

    /**
     * @param {string|object} condition
     * @param {object} params the binding parameters to be populated
     * @return {string} the HAVING clause built from [[Query::having]].
     */
    buildHaving(condition, params) {
        return this.buildCondition(condition, params).then(having => {
            return Promise.resolve(having ? 'HAVING ' + having : '');
        });
    }

    /**
     * @param {object} columns
     * @return {string} the ORDER BY clause built from [[Query::orderBy]].
     */
    buildOrderBy(columns) {
        if (_isEmpty(columns)) {
            return Promise.resolve('');
        }

        var orders = [];
        _each(columns, (direction, name) => {
            if (direction instanceof Expression) {
                orders.push(direction.expression);
            } else {
                orders.push(this.db.quoteColumnName(name) + (direction.toLowerCase() === 'desc' ? ' DESC' : ''));
            }
        });

        return Promise.resolve('ORDER BY ' + orders.join(', '));
    }

    /**
     * @param {number} limit
     * @param {number} offset
     * @return {string} the LIMIT and OFFSET clauses
     */
    buildLimit(limit, offset) {
        var sql = '';

        if (this._hasLimit(limit)) {
            sql = 'LIMIT ' + limit;
        }
        if (this._hasOffset(offset)) {
            sql += ' OFFSET ' + offset;
        }

        return Promise.resolve(_trimStart(sql));
    }

    /**
     * Checks to see if the given limit is effective.
     * @param {*} limit the given limit
     * @return {boolean} whether the limit is effective
     */
    _hasLimit(limit) {
        limit = parseInt(limit);
        return !_isNaN(limit) && limit >= 0;
    }

    /**
     * Checks to see if the given offset is effective.
     * @param {*} offset the given offset
     * @return {boolean} whether the offset is effective
     */
    _hasOffset(offset) {
        offset = parseInt(offset);
        return !_isNaN(offset) && offset > 0;
    }

    /**
     * @param {[]} unions
     * @param {object} params the binding parameters to be populated
     * @return {Promise} the UNION clause built from [[Query::union]].
     */
    buildUnion(unions, params) {
        if (_isEmpty(unions)) {
            return Promise.resolve('');
        }

        var result = '';
        var promises = [];

        _each(unions, (union, i) => {
            if (union.query instanceof Query) {
                var promise = this.build(union.query, params).then(buildResult => {
                    unions[i].query = buildResult[0];
                    params = _extend(params, buildResult[1]);
                });
                promises.push(promise);
            }
        });

        return Promise.all(promises).then(() => {
            _each(unions, (union, i) => {
                result += 'UNION ' + (union.all ? 'ALL ' : '') + '( ' + unions[i].query + ' ) ';
            });

            return _trim(result);
        });
    }

    /**
     * Processes columns and properly quote them if necessary.
     * It will join all columns into a string with comma as separators.
     * @param {string|string[]} columns the columns to be processed
     * @return {string} the processing result
     */
    buildColumns(columns) {
        if (_isString(columns)) {
            if (columns.indexOf('(') !== -1) {
                return Promise.resolve(columns);
            }

            columns = _words(columns, /[^,]+/g);
        }

        columns = _map(columns, column => {
            if (column instanceof Expression) {
                return column.expression;
            } else if (column.indexOf('(') === -1) {
                return this.db.quoteColumnName(column);
            }
            return column;
        });

        return Promise.resolve(columns.join(', '));
    }

    /**
     * Parses the condition specification and generates the corresponding SQL expression.
     * @param {string|[]} condition the condition specification. Please refer to [[Query::where()]]
     * on how to specify a condition.
     * @param {object} params the binding parameters to be populated
     * @return {string} the generated SQL expression
     * @throws InvalidParamException if the condition is in bad format
     */
    buildCondition(condition, params) {
        if (_isEmpty(condition)) {
            return Promise.resolve('');
        }
        if (!_isArray(condition) && !_isObject(condition)) {
            return Promise.resolve(String(condition));
        }

        if (condition[0]) {
            // operator format: operator, operand 1, operand 2, ...
            var operator = condition[0].toUpperCase();
            var method = _has(this._conditionBuilders, operator) ? this._conditionBuilders[operator] : 'buildSimpleCondition';

            condition = [].concat(condition);
            condition.shift();
            return this[method].call(this, operator, condition, params);
        } else {
            // hash format: 'column1': 'value1', 'column2': 'value2', ...
            return this.buildHashCondition(condition, params);
        }
    }

    /**
     * Creates a condition based on column-value pairs.
     * @param {object} condition the condition specification.
     * @param {object} params the binding parameters to be populated
     * @return {string} the generated SQL expression
     */
    buildHashCondition(condition, params) {
        var parts = [];
        var promises = [];

        _each(condition, (value, column) => {

            if (_isArray(value) || value instanceof Query) {
                // IN condition
                var promise = this.buildInCondition('IN', [
                    column,
                    value
                ], params).then(condition => {
                    parts.push(condition);
                });
                promises.push(promise);
            } else {
                if (column.indexOf('(') === -1) {
                    column = this.db.quoteColumnName(column);
                }
                if (value === null) {
                    parts.push(column + ' IS NULL');
                } else if (value instanceof Expression) {
                    parts.push(column + '=' + value.expression);
                    params = _extend(params, value.params);
                } else {
                    var phName = QueryBuilder.PARAM_PREFIX + _size(params);

                    parts.push(column + '=' + phName);
                    params[phName] = value;
                }
            }
        });

        return Promise.all(promises).then(() => {
            return parts.length === 1 ? parts[0] : '(' + parts.join(') AND (') + ')';
        });
    }

    /**
     * Connects two or more SQL expressions with the `AND` or `OR` operator.
     * @param {string} operator the operator to use for connecting the given operands
     * @param {[]} operands the SQL expressions to connect.
     * @param {object} params the binding parameters to be populated
     * @return {string} the generated SQL expression
     */
    buildAndCondition(operator, operands, params) {
        var parts = [];
        var promises = [];

        _each(operands, operand => {
            if (_isArray(operand) || _isObject(operand)) {
                var promise = this.buildCondition(operand, params).then(condition => {
                    parts.push(condition);
                });
                promises.push(promise);
            } else if (operand) {
                parts.push(operand);
            }
        });

        return Promise.all(promises).then(() => {
            return Promise.resolve(parts.length > 0 ? '(' + parts.join(') ' + operator + ' (') + ')' : '');
        });
    }

    /**
     * Inverts an SQL expressions with `NOT` operator.
     * @param {string} operator the operator to use for connecting the given operands
     * @param {[]} operands the SQL expressions to connect.
     * @param {object} params the binding parameters to be populated
     * @return {string} the generated SQL expression
     * @throws InvalidParamException if wrong number of operands have been given.
     */
    buildNotCondition(operator, operands, params) {
        if (operands.length !== 1) {
            throw new InvalidParamException('Operator \'operator\' requires exactly one operand.');
        }

        return Promise.resolve().then(() => {
            if (_isArray(operands[0])) {
                return this.buildCondition(operands[0], params);
            }

            return operands[0];
        }).then(operand => {
            return operand ? operator + ' (' + operand + ')' : '';
        });
    }

    /**
     * Creates an SQL expressions with the `BETWEEN` operator.
     * @param {string} operator the operator to use (e.g. `BETWEEN` or `NOT BETWEEN`)
     * @param {[]} operands the first operand is the column name. The second and third operands
     * describe the interval that column value should be in.
     * @param {object} params the binding parameters to be populated
     * @return {string} the generated SQL expression
     * @throws {InvalidParamException} if wrong number of operands have been given.
     */
    buildBetweenCondition(operator, operands, params) {
        if (operands.length !== 3) {
            throw new InvalidParamException('Operator `' + operator + '` requires three operands.');
        }

        var column = operands[0];
        var value1 = operands[1];
        var value2 = operands[2];

        if (column.indexOf('(') === -1) {
            column = this.db.quoteColumnName(column);
        }

        var phName1 = null;
        var phName2 = null;

        if (value1 instanceof Expression) {
            _each(value1.params, (n, v) => {
                params[n] = v;
            });
            phName1 = value1.expression;
        } else {
            phName1 = QueryBuilder.PARAM_PREFIX + _size(params);
            params[phName1] = value1;
        }
        if (value2 instanceof Expression) {
            _each(value2.params, (n, v) => {
                params[n] = v;
            });
            phName2 = value2.expression;
        } else {
            phName2 = QueryBuilder.PARAM_PREFIX + _size(params);
            params[phName2] = value2;
        }

        return Promise.resolve(column + ' ' + operator + ' ' + phName1 + ' AND ' + phName2);
    }

    /**
     * Creates an SQL expressions with the `IN` operator.
     * @param {string} operator the operator to use (e.g. `IN` or `NOT IN`)
     * @param {[]} operands the first operand is the column name. If it is an array
     * a composite IN condition will be generated.
     * The second operand is an array of values that column value should be among.
     * If it is an empty array the generated expression will be a `false` value if
     * operator is `IN` and empty if operator is `NOT IN`.
     * @param {object} params the binding parameters to be populated
     * @return {string} the generated SQL expression
     * @throws {InvalidParamException} if wrong number of operands have been given.
     */
    buildInCondition(operator, operands, params) {
        if (operands.length !== 2) {
            throw new InvalidParamException('Operator `' + operator + '` requires two operands.');
        }

        var column = operands[0];
        var values = operands[1];

        if (_isEmpty(values) || _isEmpty(column)) {
            return Promise.resolve(operator === 'IN' ? '0=1' : '');
        }

        if (values instanceof Query) {
            // sub-query
            return this.build(values, params).then(buildResult => {
                var sql = buildResult[0];
                params = _extend(params, buildResult[1]);

                if (!_isArray(column)) {
                    column = [column];
                }

                _each(column, (col, i) => {
                    if (col.indexOf('(') === -1) {
                        column[i] = this.db.quoteColumnName(col);
                    }
                });
                return '(' + column.join(', ') + ') ' + operator + ' (' + sql + ')';
            });
        }

        if (!_isArray(values)) {
            values = [values];
        }

        if (_isArray(column) && column.length > 1) {
            return this._buildCompositeInCondition(operator, column, values, params);
        }

        if (_isArray(column)) {
            column = column[0];
        }

        var inValues = [];
        _each(values, value => {
            if (_isObject(value)) {
                value = _has(value, column) ? value[column] : null;
            }

            if (value === null) {
                inValues.push('NULL');
            } else if (value instanceof Expression) {
                inValues.push(value.expression);
                params = _extend(params, value.params);
            } else {
                var phName = QueryBuilder.PARAM_PREFIX + _size(params);
                params[phName] = value;
                inValues.push(phName);
            }
        });

        if (column.indexOf('(') === -1) {
            column = this.db.quoteColumnName(column);
        }

        var result = inValues.length > 1 ? column + ' ' + operator + ' (' + inValues.join(', ') + ')' : column + (operator === 'IN' ? '=' : '<>') + inValues[0];
        return Promise.resolve(result);
    }

    /**
     *
     * @param {string} operator
     * @param {string[]} columns
     * @param {string[]} values
     * @param {object} params
     * @returns {string}
     * @private
     */
    _buildCompositeInCondition(operator, columns, values, params) {
        var vss = [];
        _each(values, value => {
            var vs = [];
            _each(columns, column => {
                if (_has(value, column)) {
                    var phName = QueryBuilder.PARAM_PREFIX + _size(params);
                    params[phName] = value[column];
                    vs.push(phName);
                } else {
                    vs.push('NULL');
                }
            });
            vss.push('(' + vs.join(', ') + ')');
        });

        _each(columns, (column, i) => {
            if (column.indexOf('(') === -1) {
                columns[i] = this.db.quoteColumnName(column);
            }
        });

        return Promise.resolve('(' + columns.join(', ') + ') ' + operator + ' (' + vss.join(', ') + ')');
    }

    /**
     * Creates an SQL expressions with the `LIKE` operator.
     * @param {string} operator the operator to use (e.g. `LIKE`, `NOT LIKE`, `OR LIKE` or `OR NOT LIKE`)
     * @param {[]} operands an array of two or three operands
     *
     * - The first operand is the column name.
     * - The second operand is a single value or an array of values that column value
     *   should be compared with. If it is an empty array the generated expression will
     *   be a `false` value if operator is `LIKE` or `OR LIKE`, and empty if operator
     *   is `NOT LIKE` or `OR NOT LIKE`.
     * - An optional third operand can also be provided to specify how to escape special characters
     *   in the value(s). The operand should be an array of mappings from the special characters to their
     *   escaped counterparts. If this operand is not provided, a default escape mapping will be used.
     *   You may use `false` or an empty array to indicate the values are already escaped and no escape
     *   should be applied. Note that when using an escape mapping (or the third operand is not provided),
     *   the values will be automatically enclosed within a pair of percentage characters.
     * @param {object} params the binding parameters to be populated
     * @return {string} the generated SQL expression
     * @throws {InvalidParamException} if wrong number of operands have been given.
     */
    buildLikeCondition(operator, operands, params) {
        if (operands.length !== 2) {
            throw new InvalidParamException('Operator `' + operator + '` requires two operands.');
        }

        var escape = operands[2] || {
                '%': '\\%',
                '_': '\\_',
                '\\': '\\\\'
            };
        delete operands[2];

        var matches = /^(AND |OR |)((NOT |)I?LIKE)/.exec(operator);
        if (matches === null) {
            throw new InvalidParamException('Invalid operator `' + operator + '`.');
        }

        var andor = ' ' + (matches[1] || 'AND ');
        var not = !!matches[3];
        var parsedOperator = matches[2];

        var column = operands[0];
        var values = operands[1];

        if (_isEmpty(values)) {
            return Promise.resolve(not ? '' : '0=1');
        }

        if (!_isArray(values)) {
            values = [values];
        }
        if (column.indexOf('(') === -1) {
            column = this.db.quoteColumnName(column);
        }

        var parts = [];
        _each(values, value => {
            var phName = null;
            if (value instanceof Expression) {
                _each(value.params, (n, v) => {
                    params[n] = v;
                });
                phName = value.expression;
            } else {
                phName = QueryBuilder.PARAM_PREFIX + _size(params);

                if (!_isEmpty(escape)) {
                    _each(escape, (to, from) => {
                        value = value.split(from).join(to);
                    });
                    value = '%' + value + '%';
                }
                params[phName] = value;
            }

            parts.push(column + ' ' + parsedOperator + ' ' + phName);
        });

        return Promise.resolve(parts.join(andor));
    }

    /**
     * Creates an SQL expressions with the `EXISTS` operator.
     * @param {string} operator the operator to use (e.g. `EXISTS` or `NOT EXISTS`)
     * @param {[]} operands contains only one element which is a [[Query]] object representing the sub-query.
     * @param {object} params the binding parameters to be populated
     * @return {string} the generated SQL expression
     * @throws {InvalidParamException} if the operand is not a [[Query]] object.
     */
    buildExistsCondition(operator, operands, params) {
        if (operands[0] instanceof Query) {
            return this.build(operands[0], params).then(buildParams => {
                var sql = buildParams[0];
                params = _extend(params, buildParams[1]);

                return operator + ' (' + sql + ')';
            });
        }

        throw new InvalidParamException('Subquery for EXISTS operator must be a Query object.');
    }

    /**
     * Creates an SQL expressions like `"column" operator value`.
     * @param {string} operator the operator to use. Anything could be used e.g. `>`, `<=`, etc.
     * @param {[]} operands contains two column names.
     * @param {object} params the binding parameters to be populated
     * @returns {string} the generated SQL expression
     * @throws InvalidParamException if wrong number of operands have been given.
     */
    buildSimpleCondition(operator, operands, params) {
        if (operands.length !== 2) {
            throw new InvalidParamException('Operator `' + operator + '` requires two operands.');
        }

        var column = operands[0];
        var value = operands[1];

        if (column.indexOf('(') === -1) {
            column = this.db.quoteColumnName(column);
        }

        var condition = null;

        if (value === null) {
            condition = column + ' ' + operator + ' NULL';
        } else if (value instanceof Expression) {
            _each(value.params, (v, n) => {
                params[n] = v;
            });
            condition = column + ' ' + operator + ' ' + value.expression;
        } else {
            var phName = QueryBuilder.PARAM_PREFIX + _size(params);
            params[phName] = value;
            condition = column + ' ' + operator + ' ' + phName;
        }

        return Promise.resolve(condition);
    }

}

/**
 * The prefix for automatically generated query binding parameters.
 */
QueryBuilder.PARAM_PREFIX = ':qp';
module.exports = QueryBuilder;