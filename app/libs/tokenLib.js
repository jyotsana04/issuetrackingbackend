const jwt = require('jsonwebtoken');
const shortid = require('shortid');
const secretKey = 'SomeVeryRandomThatNobodyCanGuessForToDoApplication';

let generateToken = (data, cb) => {
    try {
        let claims = {
            jwtid: shortid.generate(),
            iat: Date.now(),
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
            sub: 'authToken',
            iss: 'issueTrackingApp',
            data: data
        };
        let tokenDetails = {
            token: jwt.sign(claims, secretKey),
            tokenSecret: secretKey
        }
        cb(null, tokenDetails)
    } catch (error) {
        console.log(error)
        cb(error, null)
    }
}; // end generate token


let verifyClaim = (token, secretKey, cb) => {
    //verify a token symmetric
    jwt.verify(token, secretKey, function(err, decoded) {
        if (err) {
            console.log(err);
            cb(err, null);
        } else {
            cb(null, decoded);
        }
    })
}; //end of verifyClaim function

let verifyClaimWithoutSecret = (token, cb) => {
    //verify a token semetric
    jwt.verify(token, secretKey, function(err, decoded) {
        if (err) {
            console.log(err);
            cb(err, null);
        } else {
            cb(null, decoded);
        }
    });
}; //end of verify claim without secret
module.exports = {
    generateToken: generateToken,
    verifyClaim: verifyClaim,
    verifyClaimWithoutSecret: verifyClaimWithoutSecret
};