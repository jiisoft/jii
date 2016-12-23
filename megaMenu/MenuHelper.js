'use strict';

var Jii = require('../index');

class MenuHelper{

    static menuToRules(items) {
        let rules = [];
        for(const item in items) {
            if(items.hasOwnProperty(item)){
                const url = items[item].url;
                let urlRule = items[item].urlRule;

                if (url && (urlRule || urlRule == '') && typeof(url) == 'object') {
                    const defaults = url;
                    const route = defaults[0];
                    delete defaults[0];

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
}
module.exports = MenuHelper;