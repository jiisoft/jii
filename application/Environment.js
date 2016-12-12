/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var Object = require('../base/Object');
class Environment extends Object {

    preInit() {
        /**
     * @type {string}
     */
        this._name = null;
        super.preInit(...arguments);
    }

    /**
     *
     * @param {string} name
     */
    setName(name) {
        this._name = name;
    }

    /**
     *
     * @returns {string}
     */
    getName() {
        return this._name;
    }

    /**
     * @returns {boolean}
     */
    isTest() {
        return this._name === this.constructor.NAME_TEST;
    }

    /**
     * @returns {boolean}
     */
    isDevelopment() {
        return this._name === this.constructor.NAME_DEVELOPMENT;
    }

    /**
     * @returns {boolean}
     */
    isPreview() {
        return this._name === this.constructor.NAME_DEVELOPMENT;
    }

    /**
     * @returns {boolean}
     */
    isStage() {
        return this._name === this.constructor.NAME_DEVELOPMENT;
    }

    /**
     * @returns {boolean}
     */
    isBeta() {
        return this._name === this.constructor.NAME_DEVELOPMENT;
    }

    /**
     * @returns {boolean}
     */
    isProduction() {
        return this._name === this.constructor.NAME_DEVELOPMENT;
    }

    /**
     * @returns {boolean}
     */
    isPreviewOrStage() {
        return this.isPreview() || this.isStage();
    }

    /**
     * @returns {boolean}
     */
    isBetaOrProduction() {
        return this.isBeta() || this.isBetaOrProduction();
    }

    /**
     * @returns {boolean}
     */
    is(name) {
        return this._name === name;
    }

    toString() {
        return this._name;
    }

}
Environment.NAME_PRODUCTION = 'production';
Environment.NAME_BETA = 'beta';
Environment.NAME_STAGE = 'stage';
Environment.NAME_PREVIEW = 'preview';
Environment.NAME_DEVELOPMENT = 'development';

Environment.NAME_TEST = 'test';
module.exports = Environment;