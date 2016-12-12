/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

var Jii = require('../../BaseJii');
var InvalidConfigException = require('../../exceptions/InvalidConfigException');
var Collection = require('../../base/Collection');
var _clone = require('lodash/clone');
var INeatContextProfiles = require('../INeatContextProfiles');
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
     * @param {string} profileName
     * @param {string} collectionName
     * @param {object} [params]
     * @returns {Promise.<T>}
     */
    getCollection(profileName, collectionName, params) {
        params = params || {};

        /** @typedef {NeatComet.bindings.BindingServer} bingind */
        /*var binding = this.neat.engine.profilesDefinition[profileName] && this.neat.engine.profilesDefinition[profileName][name] || null;
        if (!binding) {
            throw new InvalidConfigException('Not found collection for profile id `' + name + '`');
        }*/

        return Promise.resolve().then(() => {
            // @todo Temporary code
            var opened = this.neat.engine._openedProfilesByProfileId;
            var profile = opened && opened[profileName] && opened[profileName][0] || this.neat.openProfile(profileName, params);
            var collection = profile.getCollection(collectionName);

            if (this.data[collectionName]) {
                collection.set(this.data[collectionName]);
                this.data[collectionName] = null;

                // Mark as exists record (not isNew)
                collection.each(model => {
                    model.setOldAttributes(_clone(model.getAttributes()));
                });
            /*return new Collection(this.data[collectionName], {
                        modelClass: binding.serverModel || binding.clientModel
                    })*/
            }
            return collection;
        });
    }

}
module.exports = NeatContextProfiles;