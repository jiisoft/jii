/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var BaseSchema = require('./BaseSchema');
var Expression = require('../data/Expression');
var _isBoolean = require('lodash/isBoolean');
var ModelAttributeSchema = require('../data/ModelAttributeSchema');
class ColumnSchema extends ModelAttributeSchema {

    preInit() {
        /**
     * @var {string} comment of this column. Not all DBMS support this.
     */
        this.comment = null;
        /**
     * @var {boolean} whether this column is unsigned. This is only meaningful
     * when [[type]] is `smallint`, `integer` or `bigint`.
     */
        this.unsigned = null;
        /**
     * @var {boolean} whether this column is auto-incremental
     */
        this.autoIncrement = false;
        /**
     * @var {number} scale of the column data, if it is numeric.
     */
        this.scale = null;
        /**
     * @var {number} precision of the column data, if it is numeric.
     */
        this.precision = null;
        /**
     * @var {number} display size of the column.
     */
        this.size = null;
        /**
     * @var {string[]} enumerable values. This is set only if the column is declared to be an enumerable type.
     */
        this.enumValues = null;
        /**
     * @var {string} the DB type of this column. Possible DB types vary according to the type of DBMS.
     */
        this.dbType = null;
        /**
     * @var {boolean} whether this column can be null.
     */
        this.allowNull = null;
        super.preInit(...arguments);
    }

}
module.exports = ColumnSchema;