/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../../BaseJii');
const InvalidParamException = require('../../exceptions/InvalidParamException');
const Collection = require('../../base/Collection');
const Command = require('./Command');
const Component = require('../../base/Component');
const Schema = require('./Schema');
const _each = require('lodash/each');

class Connection extends Component {

    preInit() {
        /**
         * @type {object}
         */
        this._data = {};

        /**
         * @type {object}
         */
        this._rootCollections = {};

        /**
         * @type {string}
         */
        this.route = 'api/ar';

        /**
         * @type {TransportInterface}
         */
        this.transport = null;

        /**
         * @type {Schema} the database schema
         */
        this.schema = {
            className: Schema,
        };

        super.preInit(...arguments);
    }

    init() {
        this.schema = Jii.createObject(this.schema);
    }

    getTransport() {
        if (this.transport === null) {
            this.transport = Jii.app.get('comet');
        } else if (!(this.transport instanceof Component)) {
            this.transport = Jii.createObject(this.transport);
        }
        return this.transport;
    }

    /**
     *
     * @param {string} modelClassName
     * @returns {Collection|null}
     */
    getRootCollection(modelClassName) {
        var modelClass = Jii.namespace(modelClassName);
        if (!modelClass.tableName) {
            throw new InvalidParamException('Wrong model class for create collection: ' + modelClass.className());
        }

        var tableName = modelClass.tableName();
        if (!tableName) {
            throw new InvalidParamException('Table name is not defined in model: ' + modelClass.className());
        }

        if (!this._rootCollections[tableName]) {
            this._rootCollections[tableName] = new Collection(null, {
                modelClass: modelClass
            });
            if (this._data[tableName]) {
                this._rootCollections[tableName].set(this._data[tableName]);
            }
        }
        return this._rootCollections[tableName];
    }

    /**
     * Prepare data for root collections
     * @param {object} data
     */
    setData(data) {
        _each(data, (items, tableName) => {
            if (this._rootCollections[tableName]) {
                this._rootCollections[tableName].set(items);
            } else {
                this._data[tableName] = items;
            }
        });
    }

    /**
     * Creates a command for execution.
     * @returns {Command} the DB command
     */
    createCommand() {
        return new Command({
            db: this
        });
    }

    /**
     *
     * @param {string} method
     * @param {string} modelClassName
     * @param {object} [params]
     * @returns {Promise}
     */
    exec(method, modelClassName, params) {
        params = params || {};
        params.method = method;
        params.modelClassName = modelClassName;

        return this.getTransport().request(this.route, params);
    }

    /**
     * Returns the schema information for the database opened by this connection.
     * @returns {Schema} the schema information for the database opened by this connection.
     */
    getSchema() {
        return this.schema;
    }

    /**
     * Obtains the schema information for the named table.
     * @param {string} name table name.
     * @returns {*} table schema information. Null if the named table does not exist.
     */
    getTableSchema(name) {
        return this.getSchema().getTableSchema(name);
    }

}
module.exports = Connection;