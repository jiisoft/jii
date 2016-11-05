'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');

/**
 * @class tests.unit.models.OrderWithNullFK
 * @extends tests.unit.models.ActiveRecord
 */
var OrderWithNullFK = Jii.defineClass('tests.unit.models.OrderWithNullFK', {

	__extends: ActiveRecord,

	__static: {

		tableName() {
			return 'order_with_null_fk';
		}

	}

});

module.exports = OrderWithNullFK;