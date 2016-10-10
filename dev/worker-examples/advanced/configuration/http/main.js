module.exports = {
    workers: 2,
    application: {
        components: {
            http: {
                className: 'Jii.httpServer.HttpServer',
                port: '3000'
            },
            urlManager: {
                className: 'Jii.request.UrlManager',
                rules: {
                    '': 'ers/monitor',
                    'assist': 'assist/index',
                    'clearAssist': 'assist/clearAll',
                    'debug': 'online/debug',
                    'nodejs/getAccountIcon': 'assist/getAccountIcon',
                    ':version/static/assist/build/*': 'assist/jsStatic',
                    ':version/nodejs/assist.getNextWorker': 'assist/getNextWorker',
                    ':version/nodejs/user.refreshOperatorData': 'user/refreshOperatorData',
                    ':version/nodejs/user.getOnlineOperators': 'user/getOnlineOperators',
                    ':version/nodejs/assist.clearAccount': 'assist/clearAccount',
                    ':version/nodejs/online.logoutUser': 'online/logoutUser',
                    ':version/nodejs/online.update': 'online/update',
                    ':version/nodejs/online.restore': 'online/restore',
                    ':version/nodejs/online.getOnlineStatus': 'online/getOnlineStatus',
                    ':version/nodejs/talkSession.getMessages': 'talkSession/getMessages',
                    ':version/nodejs/talkSession.pickVisitor': 'talkSession/pickVisitor',
                    ':version/nodejs/talkSession.getTalkSession': 'talkSession/getTalkSession',
                    ':version/nodejs/talkSession.userJoin': 'talkSession/userJoin',
                    ':version/nodejs/talkSession.sendMessage': 'talkSession/sendMessage',
                    ':version/nodejs/talkSession.userQuit': 'talkSession/userQuit',
                    ':version/nodejs/statistics.getOnline': 'statistics/getOnline',
                    ':version/nodejs/debug.getStatus': 'ers/getStatus',

                    // Legacy API, TM
                    ':version/action': 'legacy/capsule',
                    ':version/nodejs/legacy.pickVisitor': 'legacy/pickVisitor',
                    ':version/nodejs/legacy.sessionInfo': 'legacy/sessionInfo',
                    ':version/nodejs/legacy.sessionQuit': 'legacy/sessionQuit',
                    ':version/nodejs/legacy.getMsgs': 'legacy/getMsgs',
                    ':version/nodejs/legacy.sendMsg': 'legacy/sendMsg',
                    ':version/nodejs/legacy.acceptTransferred': 'legacy/acceptTransferred',
                    'set_online': 'legacy/setOnline',
                    'ping_user': 'legacy/pingUser',
                    'get_ws_dep': 'legacy/getWsDep',
                    'clear_visitor_accepted': 'legacy/clearVisitorAccepted',
                    'invite_to_chat': 'legacy/inviteToChat',
                    'cancel_chat_invitations': 'legacy/cancelInvitation',
                    'refuse': 'legacy/refuse',
                    'clear_flags': 'legacy/clearFlags',
                    'get_users': 'legacy/getUsers',
                    'transfer_chat': 'legacy/transferChat',

                    // Legacy API, CM
                    'check_session': 'legacy/checkSession',
                    'complete_transfer': 'legacy/null',

                    'nodejs/cometApi': 'jii/cometApi'
                }
            }
        }
    }
};