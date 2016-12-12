'use strict';

var Jii = require('../../BaseJii');
var ActiveQuery = require('../../data/ActiveQuery');
class CustomerQuery extends ActiveQuery {

    active() {
        this.andWhere('status=1');

        return this;
    }

}
module.exports = CustomerQuery;