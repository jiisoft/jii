'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');

/**
 * @class tests.unit.models.NullValues
 * @extends tests.unit.models.ActiveRecord
 */
var NullValues = Jii.defineClass('tests.unit.models.NullValues', {

	__extends: ActiveRecord,

	__static: {

		tableName() {
			return 'null_values';
		}

	}

});

module.exports = NullValues;