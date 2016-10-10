/**
 *
 * @param {Jii.application.Environment} environment
 */
module.exports = {
    application: {
        components: {
            comet: {
                className: 'Jii.comet.server.HubServer'
            }
        }
    }
};