'use strict';

var Jii = require('../BaseJii');
var _trim = require('lodash/trim');
var _clone = require('lodash/clone');
var _isUndefined = require('lodash/isUndefined');
var fs = require('fs');
var config = require('./config');
var UnitTest = require('../base/UnitTest');

require('./bootstrap');

/**
 * @class tests.unit.DatabaseTestCase
 * @extends Jii.base.UnitTest
 */
var DatabaseTestCase = Jii.defineClass('tests.unit.DatabaseTestCase', {

	__extends: UnitTest,

	database: null,
	driverName: 'mysql',

	/**
	 * @type {Jii.sql.Connection}
	 */
	db: null,

	setUp: function () {
		this.database = _clone(config[this.driverName]);

		this.mockApplication();

		return this.__super();
	},

	tearDown: function () {
		if (this.db) {
			this.db.close();
		}
		this.destroyApplication();

		return this.__super();
	},

	/**
	 * @param {boolean} [reset] whether to clean up the test database
	 * @param {boolean} [open]  whether to open and populate test database
	 * @returns {Jii.sql.Connection}
	 */
	getConnection: function (reset, open) {
		reset = !_isUndefined(reset) ? reset : true;
		open = !_isUndefined(open) ? open : true;

		if (!reset && this.db && this.db.getIsActive()) {
			return Promise.resolve(this.db);
		}

		if (this.db) {
			this.db.close();
		}

		var fixture = null;
		var config = _clone(this.database);

		if (config.fixture) {
			fixture = config.fixture;
			delete config.fixture;
		}

		return this.prepareDatabase(config, fixture, open).then(db => {
			this.db = db;
			return this.db.getSchema().refresh()
				.then(() => db);
		});
	},

	prepareDatabase: function (config, fixture, open) {
		open = open || true;

		var db = Jii.createObject(config);
		if (!open) {
			return Promise.resolve(db);
		}

		return db.open().then(function() {
			return new Promise(function(resolve, reject) {
				if (fixture === null) {
					resolve(db);
					return;
				}

				var lines = fs.readFileSync(fixture).toString().split(';');
				var i = -1;
				var execLine = function() {
					i++;
					if (i === lines.length) {
						resolve(db);
						return;
					}

					var sql = lines[i];
					if (_trim(sql) !== '') {
						db.exec(sql).then(execLine, execLine);
					} else {
						execLine();
					}
				};
				execLine();
			});
		});
	}

});

module.exports = DatabaseTestCase;
