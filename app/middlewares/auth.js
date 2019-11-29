const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const AuthModel = mongoose.model('Auth');

const logger = require('../libs/loggerLib');
const responseLib = require('../libs/responseLib');
const token = require('../libs/tokenLib');
const check = require('../libs/checkLib');

let isAuthorized = (req, res, next) => {
    if (req.params.authToken || req.query.authToken || req.body.authToken || req.header('authToken')) {
        AuthModel.findOne({ authToken: req.params.authToken || req.query.authToken || req.body.authToken || req.header('authToken') }, (err, authDetails) => {
            console.log('\n\n\n\n\n\n\n\n\nreq.query.authToken')
            console.log(req.query.authToken)
            if (err) {
                console.log(err)
                logger.error(err.message, 'Authorization Middleware', 10);
                let apiResponse = responseLib.generate(true, 'Failed to authorize', 500, null);
                res.send(apiResponse);
            } else if (check.isEmpty(authDetails)) {
                logger.error('No authorizationKey is present', 'Authorization Middleware', 10);
                let apiResponse = responseLib.generate(true, 'Invalid or expired authorization key', 404, null);
                res.send(apiResponse);
            } else {
                token.verifyClaim(authDetails.authToken, authDetails.tokenSecret, (err, decoded) => {
                    if (err) {
                        logger.error(err.message, 'Authorization Middleware', 10);
                        let apiResponse = responseLib.generate(true, 'Failed to authorize', 500, null);
                        res.send(apiResponse);
                    } else {
                        req.user = {
                            userId: decoded.data.userId
                        };
                        next();
                    }
                });
            }
        });
    } else {
        logger.error('AuthorizationToken Missing', 'Authentication token is missing in the request', 10);
        let apiResponse = responseLib.generate(true, 'Authentication token is missing in the request', 400, null);
        res.send(apiResponse);
    }
}


module.exports = {
    isAuthorized: isAuthorized
};