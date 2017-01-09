'use strict';

const Jii = require('../../index');
const UnitTest = require('../../base/UnitTest');
class I18NTest extends UnitTest {

    setUp() {
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
                                        'You have {n, plural, =0 {no photos} =1 {one photo} other {# photos}}': 'У вас {n, plural, =0 {нет фотографий} =1 {одна фотография} few {# фотографии} many {# фотографий} other {# фотографий}}'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return super.setUp();
    }

    tearDown() {
        Jii.app = null;

        return super.tearDown();
    }

    formatTest(test) {

        test.strictEqual(Jii.t('app', 'You have {n, plural, =0 {no photos} =1 {one photo} other {# photos}}', {
            n: 10
        }), 'You have 10 photos');
        test.strictEqual(Jii.t('app', 'You have {n, plural, =0 {no photos} =1 {one photo} other {# photos}}', {
            n: 1
        }), 'You have one photo');
        test.strictEqual(Jii.t('app', 'You have {n, plural, =0 {no photos} =1 {one photo} other {# photos}}', {
            n: 1
        }, 'ru'), 'У вас одна фотография');
        test.strictEqual(Jii.t('app', 'You have {n, plural, =0 {no photos} =1 {one photo} other {# photos}}', {
            n: 2
        }, 'ru'), 'У вас 2 фотографии');

        test.done();
    }

}
module.exports = new I18NTest().exports();