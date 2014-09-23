"use strict";

var mysql = require('mysql');

/**
 *
 * @class Jii.data.sql.mysql.Connection
 * @extends Jii.data.sql.BaseConnection
 */
Jii.defineClass('Jii.data.sql.mysql.Connection', {

	__extends: Jii.data.sql.BaseConnection,

	/**
	 * @type {string}
	 */
	host: '127.0.0.1',

	/**
	 * @type {string}
	 */
	port: 3306,

	/**
	 * @type {string}
	 */
	database: '',

	/**
	 * @type {string|object}
	 */
	schemaClass: 'Jii.data.sql.mysql.Schema',

	/**
	 * @type {string}
	 */
	driverName: 'mysql',

	_connection: null,

	/**
	 * Initializes the DB connection.
	 * This method is invoked right after the DB connection is established.
	 * @protected
	 */
	_initConnection: function () {
		this._connection = mysql.createConnection({
			host: this.host,
			port: this.port,
			user: this.username,
			password: this.password,
			database: this.database,
			timezone: 'local',
			typeCast: this._typeCast
		});
		this._connection.on('error', this._onError);
		this._connection.connect();

		if (this.charset !== null) {
			this.exec('SET NAMES ' + this.quoteValue(this.charset));
		}

		this.__super();
	},

	/**
	 * @protected
	 */
	_closeConnection: function () {
		if (this._connection) {
			this._connection.end();
		}
	},

	/**
	 * Disable auto typing
	 * @returns {string}
	 * @private
	 */
	_typeCast: function (field, next) {
		return field.string();
	},

	/**
	 *
	 * @param {string} message
	 * @private
	 */
	_onError: function(message) {

	},

	/**
	 *
	 * @param {string} sql
	 * @param {string} [method]
	 * @returns {Promise}
	 */
	exec: function(sql, method) {
		method = method || null;

		return new Promise(function(resolve, reject) {
			this._connection.query(sql, function(err, rows) {
				if (err) {
					// @todo
					console.error('Database query error, sql: ' + sql + ', error: ' + String(err));
					//Jii.app.logger.error('Database query error: `%s`.', err);
					reject(new Jii.data.sql.SqlQueryException(err));
					return;
				}

				var result = null;
				switch (method) {
					case 'execute':
						result = rows.affectedRows;
						break;

					case 'one':
						result = rows.length > 0 ? rows[0] : null;
						break;

					case 'all':
						result = rows;
						break;

					case 'scalar':
						result = rows.length > 0 ? _.values(rows[0])[0] : null;
						break;

					case 'column':
						result = _.map(rows, function(row) {
							return _.values(row)[0];
						});
						break;

					default:
						result = rows;
				}

				resolve(result);
			});
		}.bind(this));
	}

});