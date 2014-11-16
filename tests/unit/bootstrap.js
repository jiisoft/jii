'use strict';

/**
 * @namespace Jii
 * @ignore
 */
global.Jii = require('../../index');

Jii.createWebApplication({
	application: {
		basePath: __dirname
	}
});
