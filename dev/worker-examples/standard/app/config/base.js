/**
 *
 * @param {Jii.application.Environment} environment
 */
module.exports = function (environment) {
    return {
        application: {
            basePath: __dirname,
            components: {
                urlManager: {
                    className: 'Jii.request.UrlManager',
                    rules: {
                        '': 'site/index',
                        'users': 'site/users',
                        'view': 'site/view'
                    }
                },
                db: {
                    className: 'Jii.sql.mysql.Connection',
                    database: 'jii-my-app',
                    username: 'jii-my-app',
                    password: ''
                }
            }
        }
    }
};