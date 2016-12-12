/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var InvalidParamException = require('../exceptions/InvalidParamException');
var _isArray = require('lodash/isArray');
var _each = require('lodash/each');
var _has = require('lodash/has');
var ModelSchema = require('../data/ModelSchema');
class TableSchema extends ModelSchema {

    preInit() {
        /**
     * @var array foreign keys of this table. Each array element is of the following structure:
     *
     * ~~~
     * {
     *  0: 'ForeignTableName',
     *  fk1: 'pk1',  // pk1 is in foreign table
     *  fk2: 'pk2',  // if composite foreign key
     * }
     * ~~~
     */
        this.foreignKeys = null;
        /**
     * @var {string} sequence name for the primary key. Null if no sequence.
     */
        this.sequenceName = null;
        /**
     * @var {string} the full name of this table, which includes the schema name prefix, if any.
     * Note that if the schema name is the same as the [[Schema::defaultSchema|default schema name]],
     * the schema name will not be included.
     */
        this.fullName = null;
        /**
     * @var {string} the name of this table. The schema name is not included. Use [[fullName]] to get the name with schema name prefix.
     */
        this.name = null;
        super.preInit(...arguments);
    }

    /**
     * Manually specifies the primary key for this table.
     * @param {string|string[]} keys the primary key (can be composite)
     * @throws InvalidParamException if the specified key cannot be found in the table.
     */
    fixPrimaryKey(keys) {
        if (!_isArray(keys)) {
            keys = [keys];
        }

        this.primaryKey = keys;

        _each(this.columns, column => {
            column.isPrimaryKey = false;
        });

        _each(keys, key => {
            if (_has(this.columns, key)) {
                this.columns[key].isPrimaryKey = true;
            } else {
                throw new InvalidParamException('Primary key `key` cannot be found in table `' + key + '`.');
            }
        });
    }

}
module.exports = TableSchema;