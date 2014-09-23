/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

/**
 * @class Jii.data.sql.ColumnSchema
 * @extends Jii.base.Object
 */
Jii.defineClass('Jii.data.sql.ColumnSchema', {

	__extends: Jii.base.Object,

	/**
	 * @var {string} name of this column (without quotes).
	 */
	name: null,

	/**
	 * @var {boolean} whether this column can be null.
	 */
	allowNull: null,

	/**
	 * @var {string} abstract type of this column. Possible abstract types include:
	 * string, text, boolean, smallint, integer, bigint, float, decimal, datetime,
	 * timestamp, time, date, binary, and money.
	 */
	type: null,

	/**
	 * @var {string} the JS type of this column. Possible JS types include:
	 * string, boolean, number, double.
	 */
	jsType: null,

	/**
	 * @var {string} the DB type of this column. Possible DB types vary according to the type of DBMS.
	 */
	dbType: null,

	/**
	 * @var {*} default value of this column
	 */
	defaultValue: null,

	/**
	 * @var {string[]} enumerable values. This is set only if the column is declared to be an enumerable type.
	 */
	enumValues: null,

	/**
	 * @var {number} display size of the column.
	 */
	size: null,

	/**
	 * @var {number} precision of the column data, if it is numeric.
	 */
	precision: null,

	/**
	 * @var {number} scale of the column data, if it is numeric.
	 */
	scale: null,

	/**
	 * @var {boolean} whether this column is a primary key
	 */
	isPrimaryKey: null,

	/**
	 * @var {boolean} whether this column is auto-incremental
	 */
	autoIncrement: false,

	/**
	 * @var {boolean} whether this column is unsigned. This is only meaningful
	 * when [[type]] is `smallint`, `integer` or `bigint`.
	 */
	unsigned: null,

	/**
	 * @var {string} comment of this column. Not all DBMS support this.
	 */
	comment: null,

	/**
	 * Converts the input value according to [[jsType]].
	 * If the value is null or an [[Expression]], it will not be converted.
	 * @param {*} value input value
	 * @return {*} converted value
	 */
	typecast: function(value) {
		if (value === '' && this.type !== Jii.data.sql.mysql.BaseSchema.TYPE_TEXT &&
			this.type !== Jii.data.sql.mysql.BaseSchema.TYPE_STRING &&
			this.type !== Jii.data.sql.mysql.BaseSchema.TYPE_BINARY) {
			return null;
		}

		// @todo php->js types
		if (value === null || typeof(value) === this.jsType || value instanceof Jii.data.sql.Expression) {
			return value;
		}

		switch (this.jsType) {
			case 'string':
				return String(value);

			case 'number':
				return parseFloat(value);

			case 'boolean':
				return !!value;
		}

		return value;
	}

});
