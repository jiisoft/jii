'use strict';

var Jii = require('../../BaseJii');
var ActiveRecord = require('./ActiveRecord.js');

/**
 * @class tests.unit.models.OrderItemWithNullFK
 * @extends tests.unit.models.ActiveRecord
 */
var OrderItemWithNullFK = Jii.defineClass('tests.unit.models.OrderItemWithNullFK', {

	__extends: ActiveRecord,

	__static: {

		tableName() {
			return 'order_item_with_null_fk';
		}

	}

});

module.exports = OrderItemWithNullFK;