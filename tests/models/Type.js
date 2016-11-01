'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');

/**
 * @class tests.unit.models.Type
 * @extends tests.unit.models.ActiveRecord
 */
var Type = Jii.defineClass('tests.unit.models.Type', {

	__extends: ActiveRecord,

	__static: {

		tableName: function () {
			return 'type';
		}

	}

});

module.exports = Type;