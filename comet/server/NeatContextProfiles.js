/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../../BaseJii');
const InvalidConfigException = require('../../exceptions/InvalidConfigException');
const Collection = require('../../base/Collection');
const INeatContextProfiles = require('../INeatContextProfiles');

class NeatContextProfiles extends INeatContextProfiles {

    preInit() {
        /**
         * @type {object}
         */
        this.data = {};

        /**
         * @type {Jii.comet.client.NeatClient}
         */
        this.neat = 'neat';

        super.preInit(...arguments);
    }

    init() {
        super.init();

        this.neat = Jii.app.get(this.neat);
    }

    /**
     *
     * @param {string} name
     * @param {object} [params]
     */
    getCollection(name, params) {

        /** @typedef {NeatComet.bindings.BindingServer} bingind */
        var binding = this.neat.engine.profileBindings[name] && this.neat.engine.profileBindings[name][name] || null;
        if (!binding) {
            throw new InvalidConfigException('Not found collection for profile id `' + name + '`');
        }

        var collection = new Collection([], {
            modelClass: binding.serverModel || binding.clientModel
        });
        return new Promise(resolve => {
            // @todo open profile for client..?

            binding.loadDataLocally(params).then(data => {
                // Store data for publish to client
                this.data[name] = data;

                collection.reset(data);
                resolve(collection);
            });
        });
    }

}
module.exports = NeatContextProfiles;