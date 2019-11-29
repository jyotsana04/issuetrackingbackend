const passport = require('passport');
const passportGoogle = require('passport-google-oauth');

const mongoose = require('mongoose');
const shortid = require('shortid');
const logger = require('./../libs/loggerLib');
// const config = require('../config');
const users = require('../controllers/users');
const UserModel = mongoose.model('User');
const time = require('./../libs/timeLib');


const passportConfig = {
    clientID: '1091082596943-49t59doqnuiim4fl7nuvt1229md2us09.apps.googleusercontent.com',
    clientSecret: 'Q3ISkgY1ZodiTMZMuFZ8Pj2C',
    callbackURL: 'http://localhost:3000/api/authentication/google/redirect'
};

if (passportConfig.clientID) {
    passport.use(new passportGoogle.OAuth2Strategy(passportConfig, function(request, accessToken, refreshToken, profile, done) {

        console.log('\n\n\n\n\n\n\n\n\nresult')
        console.log(profile)
        UserModel.findOne({ 'email': profile.email }, (err, result) => {
            if (err) {
                logger.error(err.message, 'userController : findAndSaveUser', 10);
                done(null, false, 'Unable to find user details');
            } else if (!result) {
                console.log('inside result not found of find user')
                console.log('result')
                console.log(profile)
                console.log(result)
                console.log('result not found')
                let newUser = new UserModel({
                    userId: shortid.generate(),
                    name: profile.name,
                    email: profile.email,
                    password: '',
                    provider: 'google',
                    providerId: profile.id,
                    photoUrl: profile.picture,
                    createdOn: time.now()
                });
                newUser.save((err, newUser) => {
                    if (err) {
                        //console.log(err)
                        logger.error(err.message, 'userController : findAndSaveUser', 10);
                        done(true, false, 'Unable to create new user details');
                    } else {
                        let result = newUser.toObject();
                        done(null, result);
                    }
                })
            } else {
                done(null, result);
            }
        });
        done(null, profile);
    }));
}