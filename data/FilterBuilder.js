/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const NotSupportedException = require('../exceptions/NotSupportedException');
const InvalidParamException = require('../exceptions/InvalidParamException');
const _isEmpty = require('lodash/isEmpty');
const _isArray = require('lodash/isArray');
const _isObject = require('lodash/isObject');
const _uniq = require('lodash/uniq');
const _every = require('lodash/every');
const _keys = require('lodash/keys');
const _each = require('lodash/each');
const _some = require('lodash/some');
const _has = require('lodash/has');
const BaseObject = require('../base/BaseObject');
const Query = require('../data/Query');
const Expression = require('../data/Expression');
const Model = require('../base/Model');

class FilterBuilder extends BaseObject {

    preInit() {
        /**
         * @var array map of query condition to builder methods.
         * These methods are used by [[buildCondition]] to build SQL conditions from array syntax.
         */
        this._conditionBuilders = {
            'NOT': [
                'filterNotCondition',
                'attributesNotCondition'
            ],
            'AND': [
                'filterAndCondition',
                'attributesAndCondition'
            ],
            'OR': [
                'filterAndCondition',
                'attributesAndCondition'
            ],
            'BETWEEN': [
                'filterBetweenCondition',
                'attributesBetweenCondition'
            ],
            'IN': [
                'filterInCondition',
                'attributesInCondition'
            ],
            'LIKE': [
                'filterLikeCondition',
                'attributesLikeCondition'
            ],
            'OR LIKE': [
                'filterLikeCondition',
                'attributesLikeCondition'
            ],
            'EXISTS': [
                'filterExistsCondition',
                'attributesExistsCondition'
            ]
        };

        super.preInit(...arguments);
    }

    prepare(query) {
        // @todo prepare, tmp
        const ActiveQuery = require('../data/ActiveQuery');
        if (query instanceof ActiveQuery) {
            query._filterByModels([query.primaryModel]);
        }
    }

    filter(row, query) {
        return this.filterCondition(row, query.getWhere());
    }

    attributes(query) {
        return _uniq(this.attributesCondition(query.getWhere()));
    }

    createFilter(query) {
        return row => {
            if (row instanceof Model) {
                row = row.getAttributes();
            }
            return this.filter(row, query);
        };
    }

    filterCondition(row, condition) {
        if (_isEmpty(condition)) {
            return true;
        }

        if (condition[0]) {
            // operator format: operator, operand 1, operand 2, ...
            condition = [].concat(condition);

            var operator = condition[0].toUpperCase();
            var method = this._conditionBuilders[operator] ? this._conditionBuilders[operator][0] : 'filterSimpleCondition';

            if (operator.indexOf('NOT ') !== -1) {
                condition[0] = condition[0].toUpperCase().replace(/NOT /, '');
                return this.filterNotCondition(row, 'NOT', [condition]);
            }

            condition.shift();
            return this[method].call(this, row, operator, condition);
        } else {
            // hash format: {'column1': 'value1', 'column2': 'value2', ...}
            return this.filterHashCondition(row, condition);
        }
    }

    attributesCondition(condition) {
        if (_isEmpty(condition)) {
            return [];
        }

        if (condition[0]) {
            // operator format: operator, operand 1, operand 2, ...
            condition = [].concat(condition);

            var operator = condition[0].toUpperCase();
            var method = this._conditionBuilders[operator] ? this._conditionBuilders[operator][1] : 'attributesSimpleCondition';

            if (operator.indexOf('NOT ') !== -1) {
                condition[0] = condition[0].toUpperCase().replace(/NOT /, '');
                return this.attributesNotCondition('NOT', [condition]);
            }

            condition.shift();
            return this[method].call(this, operator, condition);
        } else {
            // hash format: {'column1': 'value1', 'column2': 'value2', ...}
            return this.attributesHashCondition(condition);
        }
    }

    filterHashCondition(row, condition) {
        return _every(condition, (value, column) => {
            if (_isArray(value) || value instanceof Query) {
                // IN condition
                return this.filterInCondition(row, 'IN', [
                    column,
                    value
                ]);
            }

            // Null
            if (value === null) {
                return row[column] === null;
            }

            // Null
            if (value instanceof Expression) {
                // @todo implement
                throw new NotSupportedException();
            }

            return row[column] == value;
        });
    }

    attributesHashCondition(condition) {
        return _keys(condition);
    }

    filterAndCondition(row, operator, operands) {
        var method = operator === 'AND' ? _every : _some;
        return method(operands, operand => {
            if (_isArray(operand) || _isObject(operand)) {
                return this.filterCondition(row, operand);
            }

            // @todo implement.. string?
            throw new NotSupportedException();
        });
    }

    attributesAndCondition(operator, operands) {
        var attributes = [];
        _each(operands, operand => {
            if (_isArray(operand) || _isObject(operand)) {
                attributes = attributes.concat(this.attributesCondition(operand));
            } else {
                // @todo implement.. string?
                throw new NotSupportedException();
            }
        });
        return attributes;
    }

    filterNotCondition(row, operator, operands) {
        if (operands.length !== 1) {
            throw new InvalidParamException('Operator `' + operator + '` requires exactly one operand.');
        }

        var bool = true;
        if (_isArray(operands[0]) || _isObject(operands[0])) {
            bool = this.filterCondition(row, operands[0]);
        }

        return operator === 'NOT' ? !bool : bool;
    }

    attributesNotCondition(operator, operands) {
        return this.attributesAndCondition(operator, operands);
    }

    filterBetweenCondition(row, operator, operands) {
        if (operands.length !== 3) {
            throw new InvalidParamException('Operator `' + operator + '` requires three operands.');
        }

        var column = operands[0];
        var value1 = operands[1];
        var value2 = operands[2];

        return value1 <= row[column] && row[column] <= value2;
    }

    attributesBetweenCondition(operator, operands) {
        return operands[0];
    }

    filterInCondition(row, operator, operands) {
        if (operands.length !== 2) {
            throw new InvalidParamException('Operator `' + operator + '` requires two operands.');
        }

        var column = operands[0];
        var values = operands[1];

        if (_isEmpty(values) || _isEmpty(column)) {
            return false;
        }

        if (values instanceof Query) {
            // sub-query
            throw new NotSupportedException();
        }

        if (!_isArray(values)) {
            values = [values];
        }

        if (_isArray(column) && column.length > 1) {
            // @todo
            throw new NotSupportedException();
        }

        if (_isArray(column)) {
            column = column[0];
        }

        return _some(values, value => {
            if (_isObject(value)) {
                value = _has(value, column) ? value[column] : null;
            }

            if (value === null) {
                return row[column] === null;
            }
            if (value instanceof Expression) {
                // @todo
                throw new NotSupportedException();
            }

            return row[column] == value;
        });
    }

    attributesInCondition(operator, operands) {
        return [].concat(operands[0]);
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
     * @throws {Jii.exceptions.InvalidParamException} if wrong number of operands have been given.
     */
    filterLikeCondition(operator, operands, params) {
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

        // @todo http://stackoverflow.com/questions/1314045/emulating-sql-like-in-javascript
        throw new NotSupportedException();
        /*var andor = ' ' + (matches[1] || 'AND ');
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
         phName = this.__static.PARAM_PREFIX + _size(params);

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

         return Promise.resolve(parts.join(andor));*/
    }

    /**
     * Creates an SQL expressions with the `EXISTS` operator.
     * @param {string} operator the operator to use (e.g. `EXISTS` or `NOT EXISTS`)
     * @param {[]} operands contains only one element which is a [[Query]] object representing the sub-query.
     * @param {object} params the binding parameters to be populated
     * @return {string} the generated SQL expression
     * @throws {Jii.exceptions.InvalidParamException} if the operand is not a [[Query]] object.
     */
    filterExistsCondition(operator, operands, params) {
        throw new NotSupportedException();
    }

    /**
     * Creates an SQL expressions like `"column" operator value`.
     * @param {string} operator the operator to use. Anything could be used e.g. `>`, `<=`, etc.
     * @param {[]} operands contains two column names.
     * @param {object} params the binding parameters to be populated
     * @returns {string} the generated SQL expression
     * @throws InvalidParamException if wrong number of operands have been given.
     */
    filterSimpleCondition(operator, operands, params) {
        if (operands.length !== 2) {
            throw new InvalidParamException('Operator `' + operator + '` requires two operands.');
        }

        var column = operands[0];
        var value = operands[1];

        // @todo
        throw new NotSupportedException();
        /*
         var condition = null;

         if (value === null) {
         condition = column + ' ' + operator + ' NULL';
         } else if (value instanceof Expression) {
         _each(value.params, (v, n) => {
         params[n] = v;
         });
         condition = column + ' ' + operator + ' ' + value.expression;
         } else {
         var phName = this.__static.PARAM_PREFIX + _size(params);
         params[phName] = value;
         condition = column + ' ' + operator + ' ' + phName;
         }

         return Promise.resolve(condition);*/
    }

}
module.exports = FilterBuilder;