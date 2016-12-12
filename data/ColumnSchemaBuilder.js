/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var Expression = require('../data/Expression');
var _isArray = require('lodash/isArray');
var Object = require('../base/Object');
class ColumnSchemaBuilder extends Object {

    preInit(type, length, config) {
        /**
     * @type {*} default value of the column.
     */
        this._default = null;
        /**
     * @type {string} the `CHECK` constraint for the column.
     */
        this._check = null;
        /**
     * @type {boolean} whether the column values should be unique. If this is `true`, a `UNIQUE` constraint will be added.
     */
        this._isUnique = false;
        /**
     * @type {boolean} whether the column is not nullable. If this is `true`, a `NOT NULL` constraint will be added.
     */
        this._isNotNull = false;
        length = length || null;
        config = config || [];
        /**
     * @type {string} the column type definition such as INTEGER, VARCHAR, DATETIME, etc.
     */
        this._type = type;
        /**
     * @type {number|string|[]} column size or precision definition. This is what goes into the parenthesis after
     * the column type. This can be either a string, an integer or an array. If it is an array, the array values will
     * be joined into a string separated by comma.
     */
        this._length = length;
        super.preInit(config);
    }

    /**
     * Adds a `NOT NULL` constraint to the column.
     * @returns {Jii.data.ColumnSchemaBuilder}
     */
    notNull() {
        this._isNotNull = true;
        return this;
    }

    /**
     * Adds a `UNIQUE` constraint to the column.
     * @returns {Jii.data.ColumnSchemaBuilder}
     */
    unique() {
        this._isUnique = true;
        return this;
    }

    /**
     * Sets a `CHECK` constraint for the column.
     * @param {string} check the SQL of the `CHECK` constraint to be added.
     * @returns {Jii.data.ColumnSchemaBuilder}
     */
    check(check) {
        this._check = check;
        return this;
    }

    /**
     * Specify the default value for the column.
     * @param {mixed} value the default value.
     * @returns {Jii.data.ColumnSchemaBuilder}
     */
    defaultValue(value) {
        this._default = value;
        return this;
    }

    /**
     * Specify the default SQL expression for the column.
     * @param {string} value the default value expression.
     * @returns {Jii.data.ColumnSchemaBuilder}
     */
    defaultExpression(value) {
        this._default = new Expression(value);
        return this;
    }

    /**
     * Build full string for create the column's schema
     * @returns {string}
     */
    toString() {
        return this._type + this._buildLengthString() + this._buildNotNullString() + this._buildUniqueString() + this._buildDefaultString() + this._buildCheckString();
    }

    /**
     * Builds the length/precision part of the column.
     * @returns {string}
     */
    _buildLengthString() {
        if (this._length === null || _isArray(this._length) && this._length.length === 0) {
            return '';
        }
        return '(' + [].concat(this._length).join(',') + ')';
    }

    /**
     * Builds the not null constraint for the column.
     * @returns {string} returns 'NOT NULL' if [[isNotNull]] is true, otherwise it returns an empty string.
     */
    _buildNotNullString() {
        return this._isNotNull ? ' NOT NULL' : '';
    }

    /**
     * Builds the unique constraint for the column.
     * @returns {string} returns string 'UNIQUE' if [[isUnique]] is true, otherwise it returns an empty string.
     */
    _buildUniqueString() {
        return this._isUnique ? ' UNIQUE' : '';
    }

    /**
     * Builds the default value specification for the column.
     * @returns {string} string with default value of column.
     */
    _buildDefaultString() {
        if (this._default === null) {
            return '';
        }

        var string = ' DEFAULT ';
        switch (typeof this._default) {
            case 'number':
                // ensure type cast always has . as decimal separator in all locales
                string += this._default.toString().replace(/,/g, '.');
                break;

            case 'boolean':
                string += this._default ? 'TRUE' : 'FALSE';
                break;

            case 'object':
                string += String(this._default);
                break;

            default:
                string += JSON.stringify(this._default);
        }

        return string;
    }

    /**
     * Builds the check constraint for the column.
     * @returns {string} a string containing the CHECK constraint.
     */
    _buildCheckString() {
        return this._check !== null ? ' CHECK (' + this._check + ')' : '';
    }

}
module.exports = ColumnSchemaBuilder;