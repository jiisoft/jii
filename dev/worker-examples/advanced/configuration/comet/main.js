/**
 *
 * @param {Jii.application.Environment} environment
 */
module.exports = function (environment) {
    return {
        workers: environment.isBetaOrProduction() ? 4 : 2,
        application: {
            components: {
                comet: {
                    className: 'Jii.comet.server.Server',
                    listenActions: false
                }
            }
        }
    }
};