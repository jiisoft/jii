'use strict';

var Jii = require('../../index');

var tests = Jii.namespace('tests');

/**
 * @class tests.unit.I18NTest
 * @extends Jii.base.UnitTest
 */
var self = Jii.defineClass('tests.unit.I18NTest', {

	__extends: 'Jii.base.UnitTest',

	formatTest: function (test) {
		Jii.createWebApplication({
			application: {
				components: {
					i18n: {
						className: require('../../i18n/I18N'),
						translations: {
							app: {
								className: require('../../i18n/MessageSource'),
								forceTranslation: true,
								messages: {
									'ru/app': {
										'You have {n, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}': 'У вас {n, plural, =0 {нет фотографий.} =1 {одна фотография.} other {# фотографий.}}'
									}
								}
							}
						}
					}
				}
			}
		});

		test.strictEqual(
			Jii.t('app', 'You have {n, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}', {n: 10}),
			'You have 10 photos.'
		);
		test.strictEqual(
			Jii.t('app', 'You have {n, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}', {n: 1}),
			'You have one photo.'
		);
		test.strictEqual(
			Jii.t('app', 'You have {n, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}', {n: 1}, 'ru'),
			'У вас одна фотография.'
		);

		test.done();
	}

});

module.exports = new self().exports();
