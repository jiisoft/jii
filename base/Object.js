/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var _isObject = require('lodash/isObject');
class BaseObject {

    constructor() {
        this.preInit(...arguments);

        // Run custom init method
        this.init();
    }

    preInit(config) {
        // Apply configuration to instance
        if (_isObject(config)) {
            Jii.configure(this, config);
        }
    }

    /**
         * Return full class name with namespace
         * @returns {string}
         */
    static className() {
        return this.name;
    }

    /**
         * Return extended class name with namespace
         * @returns {string}
         */
    static parentClassName() {
        return Object.getPrototypeOf(this).name;
    }

    /**
     * Customized initialize method
     */
    init() {}

    /**
     * Return full class name with namespace
     * @returns {string}
     */
    className() {
        return this.constructor.name;
    }

    /**
     * Return extended class name with namespace
     * @returns {string}
     */
    parentClassName() {
        return Object.getPrototypeOf(this).name;
    }

}
module.exports = BaseObject;