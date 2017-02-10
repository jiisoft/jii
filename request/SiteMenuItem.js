'use strict';

const Jii = require('../index');
const BaseObject = require('../base/BaseObject');
const MenuHelper  = require('./MenuHelper');
const _merge = require('lodash/merge');
const _clone = require('lodash/clone');
const _keys = require('lodash/keys');
const _difference = require('lodash/difference');

class SiteMenuItem extends BaseObject {

    preInit() {

        /**
         * @var string
         */
        this.label = null;

        /**
         * @var string|array
         */
        this.url = null;

        /**
         * Value format is identical to item from \Jii\web\UrlManager.rules
         * @var string|array|UrlRule
         */
        this.urlRule = null;

        /**
         * Value format is identical to \Jii\filters\AccessRule.roles. '?', '@' or string role are supported
         * @var {string|string[]}
         */
        this.roles = null;

        /**
         * @var bool
         */
        this.visible = null;

        /**
         * @var bool
         */
        this.encode = null;

        /**
         * @var float
         */
        this.order = 0;

        /**
         * @var SiteMenuItem[]
         */
        this.items = [];

        /**
         * @var array
         */
        this.options = [];

        /**
         * @var array
         */
        this.linkOptions = [];

        /**
         * @var SiteMenu
         */
        this.owner = null;

        /**
         * @var bool
         */
        this._active = null;

        /**
         * @var {function|function[]}
         */
        this.accessCheck = null;

        super.preInit(...arguments);
    }

    /**
     * @return {boolean}
     */
    getActive() {
        this._active = false;

        const request = MenuHelper.getRequestedRoute();
        if (this.url && this.owner.isUrlEquals(this.url, request)) {
            this._active = true;
        } else {
            for (const index in this.items) {
                if (this.items.hasOwnProperty(index)){
                    if(this.items[index].url && this.items[index].url[0] == request[0] && _difference(_keys(this.items[index].url), _keys(request)).length == 0) {
                        this.items[index].url = request;
                        this._active = true;
                    }
                    else if(this.items[index].items){
                        this._active = this.items[index].getActive();
                    }

                    if(this._active){
                        break;
                    }
                }
            }
        }

        return this._active;
    }

    /**
     * @param {boolean} value
     */
    setActive(value) {
        this._active = value;
    }

    /**
     * @return {boolean}
     */
    getVisible() {
        if (this.visible === true || this.visible === false) {
            return this.visible;
        }

        return this.checkVisible(this.url);
    }

    /**
     * @param {object} url
     * @return {boolean}
     */
    checkVisible(url) {
        if (this.roles === null && this.accessCheck === null) {
            return true;
        }

        if (typeof(this.roles) == 'string') {
            this.roles = [this.roles];
        }
        if (typeof(this.accessCheck) == 'function') {
            this.accessCheck = [this.accessCheck];
        }
        const rules = _merge(this.accessCheck || [], this.roles || []);

        if (rules) {
            for (let index in rules) {
                if (rules.hasOwnProperty(index)) {
                    if (typeof(rules[index]) == 'function') {
                        const params = rules[index](url);
                        const permissionName = _clone(params[0]);
                        delete params[0];
                        if (permissionName && Jii.app.user.can(permissionName, params)) {
                            return true;
                        }
                    } else if (rules[index] === '?') {
                        if (!Jii.app.user.role) {
                            return true;
                        }
                    } else if (rules[index] === '@') {
                        if (Jii.app.user.role) {
                            return true;
                        }
                    } else if (Jii.app.user.role == rules[index]) {
                        return true;
                    }
                }
            }
            return false;
        }

        return true;
    }

    /**
     *
     * @param forBreadcrumbs
     * @return array
     */
    toArray(forBreadcrumbs = false) {
        if (forBreadcrumbs) {
            return {
                'label': this.label,
                'url': this.url,
                'urlRule': this.urlRule,
                'items': this.items,
                'linkOptions': this.linkOptions,
            };
        }

        return {
            'label': this.label,
            'url': this.url,
            'roles': this.roles,
            'urlRule': this.urlRule,
            'visible': this.getVisible(),
            'encode': this.encode,
            'active': this.getActive(),
            'items': this.items,
            'options': this.options,
            'linkOptions': this.linkOptions,
        };
    }
}
module.exports = SiteMenuItem;