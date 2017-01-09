'use strict';

var Jii = require('../index');
var _clone = require('lodash/clone');
var _trimStart = require('lodash/trimStart');
var _forIn = require('lodash/forIn');

class MenuHelper {

    static menuToRules(items) {
        let rules = [];
        for (const item in items) {
            if (items.hasOwnProperty(item)) {
                const url = items[item].url;
                let urlRule = items[item].urlRule;

                if (url && (urlRule || urlRule == '') && typeof(url) == 'object') {
                    const defaults = _clone(url);
                    const route = defaults[0];

                    if (defaults.length > 0) {
                        defaults.splice(0, 1);
                    }
                    else {
                        delete defaults[0];
                    }

                    if (typeof(urlRule) == 'string') {
                        rules.push({
                            'pattern': urlRule,
                            'route': route,
                            'defaults': defaults
                        });
                    }
                    else if (typeof(urlRule) == 'object') {
                        if (!urlRule['route']) {
                            urlRule['route'] = route;
                        }
                        if (!urlRule['defaults']) {
                            urlRule['defaults'] = defaults;
                        }
                        rules.push(urlRule);
                    }
                }

                const subItems = items[item].items;
                if (typeof(subItems) == 'object' && subItems.length != 0) {
                    rules = MenuHelper.menuToRules(subItems).concat(rules);
                }
            }
        }

        return rules;
    }


    /**
     * @param {string} route
     * @return {string}
     */
    static normalizeRoute(route) {
        route = Jii.getAlias(route);
        if (MenuHelper.strncmp(route, '/', 1) === 0) {
            // absolute route
            return _trimStart(route, '/');
        }
        return route;
    }

    /**
     * @param {string} url
     * @param {string} urlRoute
     * @return {string}
     */
    static normalizeUrl(url, urlRoute) {
        let newUrl = urlRoute || urlRoute == '' ? urlRoute : url;
        if (typeof(newUrl) == 'string' && newUrl[0] != '/') {
            newUrl = '/' + (urlRoute || newUrl);
        }

        //repalce get params on value
        if (typeof(newUrl) == 'string' && newUrl.indexOf && newUrl.indexOf('<') != -1) {
            let oldUrl = _clone(url);
            delete oldUrl[0];
            _forIn(oldUrl, (value, key) => {
                newUrl = newUrl.replace('<' + key + '>', value);
            })
        }

        return newUrl;
    }

    /**
     * Binary-safe comparison of the first n characters of strings
     * @param str1
     * @param str2
     * @param lgth
     * @returns {number}
     */
    static strncmp(str1, str2, lgth) {
        var s1 = (str1 + '').substr(0, lgth);
        var s2 = (str2 + '').substr(0, lgth);

        return ((s1 === s2) ? 0 : ((s1 > s2) ? 1 : -1))
    }

}
module.exports = MenuHelper;