/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

/**
 * @class Jii.data.sql.TableSchema
 * @extends Jii.base.Object
 */
Jii.defineClass('Jii.data.sql.TableSchema', {

	__extends: Jii.base.Object,

	/**
	 * @var {string} the name of the schema that this table belongs to.
	 */
	schemaName: null,

	/**
	 * @var {string} the name of this table. The schema name is not included. Use [[fullName]] to get the name with schema name prefix.
	 */
	name: null,

	/**
	 * @var {string} the full name of this table, which includes the schema name prefix, if any.
	 * Note that if the schema name is the same as the [[Schema::defaultSchema|default schema name]],
	 * the schema name will not be included.
	 */
	fullName: null,

	/**
	 * @var {string[]} primary keys of this table.
	 */
	primaryKey: null,

	/**
	 * @var {string} sequence name for the primary key. Null if no sequence.
	 */
	sequenceName: null,

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
	foreignKeys: null,

	/**
	 * @var {{string: Jii.data.sql.ColumnSchema}} column metadata of this table. Each array element is a [[ColumnSchema]] object, indexed by column names.
	 */
	columns: null,

	constructor: function() {
		this.primaryKey = [];
		this.columns = {};

		this.__super.apply(this, arguments);
	},

	/**
	 * Gets the named column metadata.
	 * This is a convenient method for retrieving a named column even if it does not exist.
	 * @param {string} name column name
	 * @return {Jii.data.sql.ColumnSchema} metadata of the named column. Null if the named column does not exist.
	 */
	getColumn: function (name) {
		return _.has(this.columns, name) ? this.columns[name] : null;
	},

	/**
	 * Returns the names of all columns in this table.
	 * @return {[]} list of column names
	 */
	getColumnNames: function () {
		return _.keys(this.columns);
	},

	/**
	 * Manually specifies the primary key for this table.
	 * @param {string|string[]} keys the primary key (can be composite)
	 * @throws InvalidParamException if the specified key cannot be found in the table.
	 */
	fixPrimaryKey: function (keys) {
		if (!_.isArray(keys)) {
			keys = [keys];
		}

		this.primaryKey = keys;

		_.each(this.columns, function(column) {
			column.isPrimaryKey = false;
		});

		_.each(keys, function(key) {
			if (_.has(this.columns, key)) {
				this.columns[key].isPrimaryKey = true;
			} else {
				throw new Jii.exceptions.InvalidParamException('Primary key `key` cannot be found in table `' + key + '`.');
			}
		}.bind(this));
	}

});
