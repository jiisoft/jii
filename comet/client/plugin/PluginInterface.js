
'use strict';

var Jii = require('../../../BaseJii');
var Object = require('../../../base/Object');

/**
 * @class Jii.comet.client.plugin.PluginInterface
 * @extends Jii.base.Object
 */
var PluginInterface = Jii.defineClass('Jii.comet.client.plugin.PluginInterface', /** @lends Jii.comet.client.plugin.PluginInterface.prototype */{

	__extends: Object,

	/**
	 * @type {Jii.comet.client.Client}
	 */
	comet: null

});

module.exports = PluginInterface;