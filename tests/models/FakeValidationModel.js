'use strict';

const Jii = require('../../BaseJii');
const Model = require('../../base/Model');
class FakeValidationModel extends Model {

    preInit() {
        super.preInit(...arguments);
        this._attributes = {
            foo: null,
            bar: null
        };
    }

}
module.exports = FakeValidationModel;