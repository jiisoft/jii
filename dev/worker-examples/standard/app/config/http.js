/**
 *
 * @param {Jii.application.Environment} environment
 */
module.exports = function (environment) {
    return {
        application: {
            components: {
                http: {
                    className: 'Jii.httpServer.HttpServer'
                },
                view: {
                    className: 'Jii.view.ServerWebView'
                },
                assetManager: {
                    className: 'Jii.assets.AssetManager',
                    bundles: {
                        'app.assets.AppAsset': {}
                    }
                }
            }
        }
    }
};