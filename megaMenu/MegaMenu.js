'use strict';

var Jii = require('../index');
var MenuHelper = require('./MenuHelper');
var MegaMenuItem = require('./MegaMenuItem');
var Component = require('../base/Component');

class MegaMenu extends Component {

    preInit() {
        this._items = [];
        this._requestedRoute = null;
        this.isModulesFetched = false;

        super.preInit(...arguments);
    }

    init() {
        super.init();
        if(this._items){
            Jii.app.urlManager.setRules(MenuHelper.menuToRules(this._items));
        }
    }

    /**
     * Set menu items
     * @param {array} items
     */
    setItems(items) {
        this._items = items;
    }

    /**
     * Get all tree menu items
     * @return {array}
     */
    getItems() {
        return this._items;
    }

    /**
     * @return {MegaMenuItem}
     */
    getActiveItem() {
        return this.getItem(this.getRequestedRoute());
    }

    getRequestedRoute() {
        if (this._requestedRoute === null) {
            // Set active item
            const parseInfo = Jii.app.urlManager.parseRequest(Jii.app.request);
            if (parseInfo) {
                this._requestedRoute = [parseInfo[0] ? '/' + parseInfo[0] : ''] + parseInfo[1];
            } else {
                this._requestedRoute = ['/404'];
            }
        }
        return this._requestedRoute;
    }

    /**
     * Recursive find menu item by param item (set null for return root) and return tree menu
     * items (in format for Jii\bootstrap\Nav.items). In param custom you can overwrite items
     * configuration, if set it as array. Set param custom as integer for limit tree levels.
     * For example, getMenu(null, 2) return two-level menu
     * @param {array} fromItem
     * @param {array} custom Items or level limit
     * @return {array}
     */
    getMenu(fromItem = null, custom = []) {
        let itemModels = [];
        if (fromItem) {
            const item = this.getItem(fromItem);
            if (item !== null) {
                itemModels = item.items;
            }
        } else {
            itemModels = this.getItems();
        }
    
        if (typeof(custom) == 'number') {
            // Level limit
            return this.sliceTreeItems(itemModels, custom);
        }
    
        let menu = [];
        if (!custom) {
            // All
            menu = itemModels;
        } else {
            // Custom
            /** @TODO */
            /*  foreach (custom as item) {
             menuItemModel = this.getItem(item);
    
             // Process items
             if (item['items']) {
             menuItemModel['items'] = this.getMenu(item['items']);
             } else {
             unset(menuItemModel['items']);
             }
    
             // Extend item
             menuItemModel = array_merge(menuItemModel, item);
    
             menu.push(menuItemModel;
             }*/
        }
    
        return menu.map(itemModel => {
            /** @var {MegaMenuItem} itemModel */
            return itemModel.toArray();
        });
    }

    /**
     * Find item by url (ot current page) label and return it
     * @param {array} url Child url or route, default - current route
     * @return {string}
     */
    getTitle(url = null) {
        const titles = this.getBreadcrumbs(url).reverse();
        return titles ? titles[0]['label'] : '';
    }

    /**
     * Find item by url (or current page) and return item label with all parent labels
     * @param {array} url Child url or route, default - current route
     * @param {string} separator Separator, default is " - "
     * @return {string}
     */
    getFullTitle(url = null, separator = ' — ') {
        let title = [];
        this.getBreadcrumbs(url).reverse().map(item => {
            title.push(item['label']);
        });
        title.push(Jii.app.name);
        return title.join(separator);
    }

    /**
     * Return breadcrumbs links for widget \Jii-react\widgets\Breadcrumbs
     * @param {array} url Child url or route, default - current route
     * @return {array}
     */
    getBreadcrumbs(url = null) {
        url = url ? url: this.getRequestedRoute();

        // Find child and it parents by url
        let parents = null;
        itemModel = this.getItem(url, parents);

        if (!itemModel || (!parents && this.isHomeUrl(itemModel.url))) {
            return [];
        }

        parents.reverse().push({
            'label': itemModel.label,
            'url': itemModel.url,
            'linkOptions': typeof(itemModel.linkOptions) == 'object' ? itemModel.linkOptions : [],
        });

        parents.map(parent => {
            if (parent['linkOptions']) {
                parent = parent.concat(parent['linkOptions']);
                delete parent['linkOptions'];
            }
        });

        return parents;
    }

    /**
     * Find menu item by item url or route. In param parents will be added all parent items
     * @param {string|array} item
     * @param {array} parents
     * @return MegaMenuItem|null
     */
    getItem(item, parents = []) {
        url = typeof(item) == 'object' && !this.isRoute(item) ?
            item['url'] :
            item;

        return this.findItemRecursive(url, this.getItems(), parents);
    }

    /**
     * Find item by url or route and return it url
     * @param item
     * @return {array}|null|string
     */
    getItemUrl(item) {
        item = this.getItem(item);
        return item ? item.url : null;
    }

    /**
     * @param {string|array|MegaMenuItem} url1
     * @param {string|array} url2
     * @return {boolean}
     */
    isUrlEquals(url1, url2) {
        if (url1 instanceof MegaMenuItem) {
            url1 = url1.url;
        }
        if (url2 instanceof MegaMenuItem) {
            url2 = url2.url;
        }

        // Is routes
        if (this.isRoute(url1) && this.isRoute(url2)) {
            if (MenuHelper.normalizeRoute(url1[0]) !== MenuHelper.normalizeRoute(url2[0])) {
                return false;
            }

            // Compare routes' parameters by checking if keys are identical
            if (count(array_diff_key(url1, url2)) || count(array_diff_key(url2, url1))) {
                return false;
            }

            Object.keys(url1).map(key => {
                if (typeof(key) == 'string' && key !== '#') {
                    if (!url2[key]) {
                        return false;
                    }

                    if (value !== null && url2[key] !== null && url2[key] !== value) {
                        return false;
                    }
                }
            });

            return true;
        }

        // Is urls
        if (typeof(url1) == 'string' && typeof(url2) == 'string') {
            return url1 === url2;
        }

        return false;
    }

    /**
     * @param {string|array} url
     * @return {boolean}
     */
    isHomeUrl(url) {
        if (this.isRoute(url)) {
            return this.isUrlEquals(['/' + Jii.app.defaultRoute], url);
        }
        return url === '/'; //Jii.app.HomeUrl
    }

    /**
     * @param {mixed} value
     * @return {boolean}
     */
    isRoute(value) {
        return typeof(value) == 'object' && value[0] && typeof(value[0]) == 'string';
    }

    /**
     * @param {MegaMenuItem[]} items
     * @param {number} level
     * @return {array}
     */
    sliceTreeItems(items, level = 1) {
        if (level <= 0) {
            return [];
        }
    
        let menu = [];
        items.map(itemModel => {
        let item = itemModel.toArray();
    
        if (itemModel.items) {
            let nextLevel = level;
            if (itemModel.url !== null) {
                nextLevel--;
            }
    
            item['items'] = this.sliceTreeItems(itemModel.items, nextLevel);
        }
    
        if (empty(item['items'])) {
                item['items'] = null;
            }
            menu.push(item);
        });
        
        return menu;
    }

    /**
     * @param {string|array} url
     * @param {MegaMenuItem[]} items
     * @param {array} parents
     * @return MegaMenuItem
     */
    findItemRecursive(url, items, parents) {
        items.map(itemModel => {
            if (itemModel.url && this.isUrlEquals(url, itemModel.url)) {
                return itemModel;
            }
        
            if (!empty(itemModel.items)) {
                let foundItem = this.findItemRecursive(url, itemModel.items, parents);
                if (foundItem) {
                    let parentItem = itemModel.toArray();
                    delete parentItem['items'];
                    parents.push(parentItem);
        
                    return foundItem;
                }
            }
        });
    
        return null;
    }
}
module.exports = MegaMenu;