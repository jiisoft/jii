'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('../../data/ActiveRecord');

/**
 * @class tests.unit.models.ActiveRecord
 * @extends Jii.data.ActiveRecord
 */
var TestActiveRecord = Jii.defineClass('tests.unit.models.ActiveRecord', {

	__extends: ActiveRecord,

	__static: {

		db: null,

		getDb() {
			return ActiveRecord.db;
		}

	}

});

module.exports = TestActiveRecord;