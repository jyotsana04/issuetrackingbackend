const passportFacebook = require('passport-facebook');
// const config = require('../config');
const users = require('../controllers/users');
var session = require("express-session");
const passportConfig = {
    clientID: '1300603060105584',
    clientSecret: 'de07c12e3ab78a05a2aede1053947db4',
    callbackURL: 'http://localhost:3000/api/authentication/facebook/redirect'
};

var facebookStrategy = require('passport-facebook').Strategy;
module.exports = function(app, passport) {

        app.use(passport.initialize());
        app.use(passport.session());
        app.use(session({ secret: "cats", resave: false, saveUninitialized: true, cookie: { secure: false } }));

        passport.serializeUser((user, done) => {
            done(null, user.id);
        });
        passport.deserializeUser((id, done) => {
            done(null, user.id);
        });
        passport.use(new passportFacebook.Strategy(passportConfig, function(accessToken, refreshToken, profile, done) {
           
            return done(null, profile);
            
        }));


        app.get('/api/authentication/facebook/redirect',
            passport.authenticate('facebook', { session: false, failureRedirect: '/login' }));

        app.get('/api/authentication/facebook/start',
            passport.authenticate('facebook', { session: false }));
        return passport;
    }
    