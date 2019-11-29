const mongoose = require('mongoose');
const shortid = require('shortid');
const passport = require('passport');
const logger = require('./../libs/loggerLib');
const passportFacebook = require('passport-facebook');
// const config = require('../config');
const users = require('../controllers/users');
const UserModel = mongoose.model('User');
const time = require('./../libs/timeLib');

const passportConfig = {
    clientID: '1300603060105584',
    clientSecret: 'de07c12e3ab78a05a2aede1053947db4',
    callbackURL: 'http://localhost:3000/api/authentication/facebook/redirect'
};

if (passportConfig.clientID) {
    console.log('Hiiiii')
    passport.use(new passportFacebook.Strategy(passportConfig, function(accessToken, refreshToken, profile, done) {
        // let user = users.getUserByExternalId('facebook', profile.id);
        // if (!user) {
        //     user = users.createUser(profile.displayName, 'facebook', profile.id);
        // }
        console.log('profile')
        console.log(profile)

        UserModel.findOne({ 'email': profile.email }, (err, result) => {
            if (err) {
                logger.error(err.message, 'userController : findAndSaveUser', 10);
                done(null, false, 'Unable to find user details');
            } else if (!result) {
                console.log('inside result not found of find user')
                console.log('result')
                console.log(result)
                console.log(profile)
                console.log('result not found')
                let newUser = new UserModel({
                    userId: shortid.generate(),
                    name: profile.name,
                    email: profile.email,
                    password: '',
                    provider: 'facebook',
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


        return done(null, profile);
        // console.log('profile');
        // console.log(profile);
        // return done(null, null, 'done');
    }));
}