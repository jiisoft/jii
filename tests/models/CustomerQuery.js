'use strict';

var Jii = require('../../BaseJii');
var ActiveQuery = require('../../data/ActiveQuery');

/**
 * @class tests.unit.models.CustomerQuery
 * @extends Jii.data.ActiveQuery
 */
var CustomerQuery = Jii.defineClass('tests.unit.models.CustomerQuery', {

	__extends: ActiveQuery,

	active() {
		this.andWhere('status=1');

		return this;
	}

});

module.exports = CustomerQuery;