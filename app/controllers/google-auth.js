const GOOGLE_CLIENT_ID = '744821336225-fjv19pnh05421mrbkgtpv71lq8as8fat.apps.googleusercontent.com';
const { OAuth2Client } = require('google-auth-library');
var client = new OAuth2Client(GOOGLE_CLIENT_ID, '4t10Rh3eLbfd8vHaIlQ5ufY9', '');

module.exports.getGoogleUser = code => {
    return client.verifyIdToken({ idToken: code, audience: GOOGLE_CLIENT_ID })
        .then(login => {
            console.log('inside login')
            var payload = login.getPayload();
            var audience = payload.aud;
            console.log(payload)
            console.log(audience)
            if (audience !== GOOGLE_CLIENT_ID) {
                throw new Error(
                    'error while authenticating google user: audience mismatch: wanted [' +
                    GOOGLE_CLIENT_ID +
                    '] but was [' +
                    audience +
                    ']'
                );
            }
            return {
                name: payload['name'],
                pic: payload['picture'],
                id: payload['sub'],
                email_verified: payload['email_verified'],
                email: payload['email']
            };
        })
        .then(user => {
            console.log('user')
            console.log(user)

            return user;
        })
        .catch(err => {
            return {
                error: true,
                message: 'error while authenticating google user: ' + JSON.stringify(err)
            };
        });
};