/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const InvalidConfigException = require('../exceptions/InvalidConfigException');
const ModelAttributeSchema = require('./ModelAttributeSchema');
const _isString = require('lodash/isString');
const _isNumber = require('lodash/isNumber');
const _isObject = require('lodash/isObject');
const _isEmpty = require('lodash/isEmpty');
const _each = require('lodash/each');
const _has = require('lodash/has');
const _keys = require('lodash/keys');
const BaseObject = require('../base/BaseObject');

class ModelSchema extends BaseObject {

    preInit() {
        /**
         * @var {{string: ModelAttributeSchema}} column metadata of this table. Each array element is a [[ModelAttributeSchema]] object, indexed by column names.
         */
        this.columns = {};

        /**
         * @var {string[]} primary keys of this table.
         */
        this.primaryKey = [];

        /**
         * @var {string} the name of the schema that this table belongs to.
         */
        this.schemaName = '';

        super.preInit(...arguments);
    }

    /**
     *
     * @param {object} obj
     * @returns {ModelSchema}
     */
    static createFromObject(obj) {
        if (_isString(obj.primaryKey)) {
            obj.primaryKey = [obj.primaryKey];
        }

        _each(obj.columns, (column, name) => {
            if (!(column instanceof ModelAttributeSchema)) {
                if (_isString(column)) {
                    if (_isNumber(name)) {
                        var parts = column.split(':');
                        column = {
                            name: parts[0],
                            type: 'string'
                        };
                    } else {
                        column = {
                            name: name,
                            type: column
                        };
                    }
                }

                if (!_isObject(column)) {
                    throw new InvalidConfigException('Invalid column format: ' + column);
                }
                if (!_isString(name)) {
                    column.name = name;
                }
                obj.columns[name] = new ModelAttributeSchema(column);
            }
        });

        return new this(obj);
    }

    /**
     * Gets the named column metadata.
     * This is a convenient method for retrieving a named column even if it does not exist.
     * @param {string} name column name
     * @return {ModelAttributeSchema} metadata of the named column. Null if the named column does not exist.
     */
    getColumn(name) {
        return _has(this.columns, name) ? this.columns[name] : null;
    }

    /**
     * Returns the names of all columns in this table.
     * @return {[]} list of column names
     */
    getColumnNames() {
        return _keys(this.columns);
    }

    toJSON() {
        var obj = {};

        if (!_isEmpty(this.primaryKey)) {
            obj.primaryKey = this.primaryKey;
        }
        if (!_isEmpty(this.schemaName)) {
            obj.schemaName = this.schemaName;
        }
        if (!_isEmpty(this.columns)) {
            obj.columns = {};
            _each(this.columns, (column, name) => {
                obj.columns[name] = column.toJSON();
            });
        }

        return obj;
    }

}
module.exports = ModelSchema;