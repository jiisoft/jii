'use strict';

var Jii = require('../index');
var BaseObject = require('../base/Object');

class MegaMenuItem extends BaseObject {

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
         * Value format is identical to item from \yii\web\UrlManager::rules
         * @var string|array|UrlRule
         */
        this.urlRule = null;

        /**
         * Value format is identical to \yii\filters\AccessRule::roles. "?", "@" or string role are supported
         * @var string|string[]
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
         * @var MegaMenuItem[]
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
         * @var MegaMenu
         */
        this.owner = null;

        /**
         * @var bool
         */
        this._active = null;

        /**
         * @var callable|callable[]
         */
        this.accessCheck = null;

        super.preInit(...arguments);
    }

    /**
     * @return {boolean}
     */
    getActive() {
        if (this._active === null) {
            this._active = false;

            if (this.url && this.owner.isUrlEquals(this.url, this.owner.getRequestedRoute())) {
                this._active = true;
            } else {
                for(const itemModel in this.items) {
                    if (this.items.hasOwnProperty(itemModel) && this.items[itemModel].active) {
                        this._active = true;
                        break;
                    }
                }
            }
        }
        return this._active;
    }

    /**
     * @param {bool} value
     */
    setActive(value) {
        this._active = value;
    }

    /**
     * @return {boolean}
     */
    getVisible() {
        if (this.visible !== null) {
            return this.visible;
        }

        return this.checkVisible(this.url);
    }

    /**
     *
     * @param forBreadcrumbs
     * @return array
     */
    toArray(forBreadcrumbs = false) {
        if(forBreadcrumbs){
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
            'visible': this.visible,
            'encode': this.encode,
            'active': this.active,
            'items': this.items,
            'options': this.options,
            'linkOptions': this.linkOptions,
        };
    }
}
module.exports = MegaMenuItem;