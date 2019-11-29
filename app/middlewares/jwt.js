const passport = require('passport');
const passportJwt = require('passport-jwt');
const users = require('../controllers/users')

const jwtOptions = {
    jwtFromRequest: passportJwt.ExtractJwt.fromAuthHeaderWithScheme('jwt'),
    secretOrKey: 'SomeVeryRandomThatNobodyCanGuessForToDoApplication',
    issuer: 'issueTrackingApp',
    audience: 'issueTrackingApp'
};

passport.use(new passportJwt.Strategy(jwtOptions, (payload, done) => {
    console.log('\n\n\n\n\n\npayload')
    console.log(payload)

    const user = users.getUserById(parseInt(payload.sub));
    if (user) {
        return done(null, user, payload);
    }
    return done();
}));