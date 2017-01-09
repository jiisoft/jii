/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

const Jii = require('../../BaseJii');
const FilterBuilder = require('../../data/FilterBuilder');
const ModelSchema = require('../../data/ModelSchema');
const _isObject = require('lodash/isObject');
const _keys = require('lodash/keys');
const BaseObject = require('../../base/BaseObject');
class Schema extends BaseObject {

    preInit() {
        this._filterBuilder = null;
        this.tables = {};
        super.preInit(...arguments);
    }

    /**
     * @return {Jii.data.QueryBuilder} the query builder for this connection.
     */
    getFilterBuilder() {
        if (this._filterBuilder === null) {
            this._filterBuilder = this.createFilterBuilder();
        }

        return this._filterBuilder;
    }

    /**
     *
     * @param {string} name
     * @returns {Jii.data.ModelSchema}
     */
    getTableSchema(name) {
        if (_isObject(this.tables[name]) && !(this.tables[name] instanceof ModelSchema)) {
            this.tables[name] = ModelSchema.createFromObject(this.tables[name]);
        }

        return this.tables[name] || null;
    }

    getTableNames() {
        return _keys(this.tables);
    }

    /**
     * @return {Jii.data.FilterBuilder}
     */
    createFilterBuilder() {
        return new FilterBuilder();
    }

}
module.exports = Schema;