/* external libraries */
const mongoose = require('mongoose');
const shortid = require('shortid');

/* Libraries */
const logger = require('./../libs/loggerLib');
const check = require('./../libs/checkLib');
const validateInput = require('./../libs/validateInputLib');
const response = require('./../libs/responseLib');
const time = require('./../libs/timeLib');
const passwordLib = require('../libs/passwordLib');
const token = require('../libs/tokenLib');
//to titlecase library
const titleCase = require('title-case');
/* Models */
const UserModel = mongoose.model('User');
const AuthModel = require('../models/Auth.js');

const IssueModel = mongoose.model('Issue');

const googleAuth = require('./google-auth');

const GOOGLE_CLIENT_ID = '744821336225-fjv19pnh05421mrbkgtpv71lq8as8fat.apps.googleusercontent.com';
const { OAuth2Client } = require('google-auth-library');
var client = new OAuth2Client(GOOGLE_CLIENT_ID, '4t10Rh3eLbfd8vHaIlQ5ufY9', '');


var fs = require('fs');
const path = require('path');
let loginFunction = (req, res) => {
    let validateParameters = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(req.body.username) || check.isEmpty(req.body.password)) {
                logger.error('username or password is missing', 'userController : loginFunction=>validateParameters', 10);
                let apiResponse = response.generate(true, 'Username or password is missing in the request', 400, null);
                reject(apiResponse);
            }
            resolve();
        })
    }; //end of validate Parameters
    fetchUser = () => {
        return new Promise((resolve, reject) => {

            UserModel.findOne({ 'email': req.body.username.trim().toLowerCase() }, (err, result) => {
                if (err) {
                    logger.error(err, 'userController : loginFunction=> fetchUser', 10);
                    let apiResponse = response.generate(true, err, 400, null);
                    reject(apiResponse);
                } else if (check.isEmpty(result)) {
                    logger.error('Invalid username', 'userController : loginFunction=> fetchUser', 10);
                    let apiResponse = response.generate(true, 'Invalid Username', 400, null);
                    reject(apiResponse);
                } else {
                    resolve(result);
                }
            });
        });
    }; //end of fetchUser
    //start of validate password function
    let validatePassword = (retrivedUserDetails) => {
        return new Promise((resolve, reject) => {
            passwordLib.comparePassword(req.body.password, retrivedUserDetails.password, (err, isMatch) => {
                if (err) {
                    logger.error(err.message, 'userController: validatePassword()', 10);
                    let apiResponse = response.generate(true, 'Login Failed', 500, null);
                    reject(apiResponse);
                } else if (isMatch) {
                    let retrievedUserDetailsObj = retrivedUserDetails.toObject()
                    delete retrievedUserDetailsObj.password
                    delete retrievedUserDetailsObj.__v
                    delete retrievedUserDetailsObj.createdOn
                    resolve(retrievedUserDetailsObj)
                } else {
                    logger.info('Login Failed Due To Invalid Password', 'userController: validatePassword()', 10)
                    let apiResponse = response.generate(true, 'Wrong Password. Login Failed', 400, null)
                    reject(apiResponse)
                }
            });
        });
    }; //end of validatePassword method

    //start of generate token
    let generateToken = (userDetails) => {
        return new Promise((resolve, reject) => {
            token.generateToken(userDetails, (err, tokenDetails) => {
                if (err) {
                    ////console.log(err)
                    let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                    reject(apiResponse)
                } else {
                    tokenDetails.userId = userDetails.userId
                    tokenDetails.userDetails = userDetails
                    resolve(tokenDetails)
                }
            })
        })
    }; //end of generateToken method
    let saveToken = (tokenDetails) => {
        ////console.log(tokenDetails)
        return new Promise((resolve, reject) => {
            AuthModel.findOne({ userId: tokenDetails.userId },
                (err, retrievedTokenDetails) => {
                    if (err) {
                        logger.error(err, 'userController : saveToken', 10);
                        let apiResponse = response.generate(true, 'Failed to generate token',
                            500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(retrievedTokenDetails)) {
                        ////console.log('empty auth token')
                        let newAuthToken = new AuthModel({
                            userId: tokenDetails.userId,
                            authToken: tokenDetails.token,
                            tokenSecret: tokenDetails.tokenSecret,
                            tokenGenerationTime: time.now()
                        });
                        newAuthToken.save((err, newTokenDetails) => {
                            if (err) {
                                logger.error(err.message, 'userController : saveToken', 10);
                                let apiResponse = response.generate(true, 'Failed to generate token', 500, 10);
                                reject(apiResponse);
                            } else {
                                let responseBody = {
                                    authToken: newTokenDetails.authToken,
                                    userDetails: tokenDetails.userDetails
                                }
                                resolve(responseBody);
                            }
                        })
                    } else {
                        ////console.log('already exist auth token')
                        retrievedTokenDetails.authToken = tokenDetails.token;
                        retrievedTokenDetails.tokenSecret = tokenDetails.tokenSecret;
                        retrievedTokenDetails.tokenGenerationTime = time.now();
                        retrievedTokenDetails.save((err, newTokenDetails) => {
                            if (err) {
                                ////console.log(err);
                                logger.error(err.message, 'userController : saveToken', 10)
                                let apiResponse = response.generate(true, 'Failed to generate token', 500, 10);
                                reject(apiResponse);
                            } else {
                                ////console.log(newTokenDetails)
                                let responseBody = {
                                    authToken: newTokenDetails.authToken,
                                    userDetails: tokenDetails.userDetails
                                }
                                resolve(responseBody);
                            }
                        })
                    }
                })
        });
    }; //end of saveToken method

    validateParameters()
        .then(fetchUser)
        .then(validatePassword)
        .then(generateToken)
        .then(saveToken)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Login Successful', 200, resolve)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            res.status(err.status)
            res.send(err)
        });
};
let signInSocial = (req, res) => {

    let getUser = (req, res) => {
        const body = req.body;
        const typeOfReq = body.type;
        
        switch (typeOfReq) {
            case 'google':
                return googleAuth
                    .getGoogleUser(body.idToken)
                    .then(apiResponse => {
                        if (apiResponse.error) {
                           
                            throw new Error(apiResponse.message);
                        } else {
                            
                        }
                        return apiResponse;
                    }).catch(e => {
                        
                        let error = {
                            error: true,
                            status: 404,
                            message: e.message,
                            data: null
                        }
                        res.send(error)
                    });
                break;
            default:
                return new Error('unknow token type [' + type + ']');
        }
    };
    let findAndSaveUser = (apiResponse) => {
       

        return new Promise((resolve, reject) => {
            UserModel.findOne({ 'email': apiResponse.email }, (err, result) => {
                if (err) {
                    logger.error(err.message, 'userController : findAndSaveUser', 10);
                    let apiResponse = response.generate(true, 'Unable to find user details ' + err, 400, null);
                    reject(apiResponse);
                } else if (!result) {
                   
                    let newUser = new UserModel({
                        userId: shortid.generate(),
                        name: apiResponse.name,
                        email: apiResponse.email.toLowerCase(),
                        password: '',
                        provider: req.body.type,
                        providerId: apiResponse.id,
                        photoUrl: apiResponse.pic,
                        createdOn: time.now()
                    });
                    newUser.save((err, newUser) => {
                        if (err) {
                            ////console.log(err)
                            logger.error(err.message, 'userController : findAndSaveUser', 10);
                            reject(true, 'Unable to create new user details', 400, null);
                        } else {
                            let result = newUser.toObject();
                            resolve(result);
                        }
                    })
                } else {
                    resolve(result);
                }
            });
        });
    }; //end of findAndSaveUser
    let createToken = (result) => {
        
        //start of generate token
        return new Promise((resolve, reject) => {
            token.generateToken(result, (err, tokenDetails) => {
                if (err) {
                    reject(response.generate(true, 'Failed To Generate Token', 500, null))
                } else {
                    tokenDetails.userId = result.userId;
                    tokenDetails.userDetails = result;
                    resolve(tokenDetails);
                }
            })
        })
    }; //end of createToken method

    let saveToken = (tokenDetails) => {
       
        return new Promise((resolve, reject) => {
            AuthModel.findOne({ userId: tokenDetails.userId },
                (err, retrievedTokenDetails) => {
                    if (err) {
                        logger.error(err, 'userController : saveToken', 10);
                        let apiResponse = response.generate(true, 'Failed to generate token',
                            500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(retrievedTokenDetails)) {
                        ////console.log('empty auth token')
                        let newAuthToken = new AuthModel({
                            userId: tokenDetails.userId,
                            authToken: tokenDetails.token,
                            tokenSecret: tokenDetails.tokenSecret,
                            tokenGenerationTime: time.now()
                        });
                        newAuthToken.save((err, newTokenDetails) => {
                            if (err) {
                                logger.error(err.message, 'userController : saveToken', 10);
                                let apiResponse = response.generate(true, 'Failed to generate token', 500, 10);
                                reject(apiResponse);
                            } else {
                                let responseBody = {
                                    authToken: newTokenDetails.authToken,
                                    userDetails: tokenDetails.userDetails
                                }
                                resolve(responseBody);
                            }
                        })
                    } else {
                        ////console.log('already exist auth token')
                        retrievedTokenDetails.authToken = tokenDetails.token;
                        retrievedTokenDetails.tokenSecret = tokenDetails.tokenSecret;
                        retrievedTokenDetails.tokenGenerationTime = time.now();
                        retrievedTokenDetails.save((err, newTokenDetails) => {
                            if (err) {
                                ////console.log(err);
                                logger.error(err.message, 'userController : saveToken', 10)
                                let apiResponse = response.generate(true, 'Failed to generate token', 500, 10);
                                reject(apiResponse);
                            } else {
                                ////console.log(newTokenDetails)
                                let responseBody = {
                                    authToken: newTokenDetails.authToken,
                                    userDetails: tokenDetails.userDetails
                                }
                                resolve(responseBody);
                            }
                        })
                    }
                })
        });
    }; //end of saveToken method


    getUser(req, res)
        .then(findAndSaveUser)
        .then(createToken)
        .then(saveToken)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Login Successful', 200, resolve)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            ////console.log("errorhandler");
            ////console.log(err);
            res.status(err.status)
            res.send(err)
        });
   
}; //end of singinfunction

let getAllUsersFunction = (req, res) => {
    UserModel.find()
        .select('userId name')
        .lean()
        .exec((err, result) => {
            if (err) {
                logger.error(err, 'userController : getAllUserFunction', 10);
                let apiResponse = response.generate(true, err, 400, null);
                res.send(apiResponse)
            } else if (!result) {
                let apiResponse = response.generate(false, 'No data found', 204, null);
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'Users data found successfully', 200, result);
                res.send(apiResponse)
            }
        })
}; //end of getAllUserFunction
let createIssueFunction = (req, res) => {
    //console.log('req.body')
    //console.log(req.body)

    //console.log('req.files')
    //console.log(req.files)
    let checkParameters = (req, res) => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(req.body.title) || check.isEmpty(req.body.description) || check.isEmpty(req.body.assignee)) {
                logger.error('1 or more parameters are missing', 'userController:createIssueFunction=>checkParameters', 8);
                let apiResponse = response.generate(true, '1 or more parameters are missing', 400, null);
                reject(apiResponse);
            } else {
                //console.log('it is done')
                resolve(req);
            }
        });
    }; //end of checkParameters

    let saveData = (req) => {
        //console.log('req')
        //console.log(req.files)
        return new Promise((resolve, reject) => {
            let d = [];
            req.files.forEach(element => {
                d.push(element.filename);
            });
            //console.log('d');
            //console.log(d);
            let issueData = new IssueModel({
                issueId: shortid.generate(),
                title: titleCase(req.body.title.trim()),
                description: req.body.description.trim(),
                attachment: d,
                assignedTo: req.body.assignee,
                createdBy: req.body.createdBy,
                modifiedBy: req.body.createdBy,
                createdOn: time.getLocalTime(),
                lastModifiedOn: time.getLocalTime()
            });
            //console.log('issueData')
            //console.log(issueData)

            //save to db
            issueData.save((err, generatedIssue) => {
                if (err) {
                    ////console.log(err)
                    logger.error(err.message, 'userController:createIssueFunction=>saveData', 10);
                    let apiResponse = response.generate(true, 'Unable to create new issue', 400, null);
                    reject(apiResponse);
                } else {
                    let generatedIssueObject = generatedIssue.toObject();
                    resolve(generatedIssueObject);
                }
            });
        });
    }; //end of saveData

    checkParameters(req, res)
        .then(saveData)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Issue created successfully', 200, resolve)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            logger.error(err, 'While saving issue', 10);
            res.status(err.status)
            res.send(err)
        });
}; //end of create issue function

let register = (req, res) => {
    //console.log('req.body')
    console.log("my request",req.body)

    var env = process.env.NODE_ENV || 'dev';
    //console.log('\n\n\n\n\n\n\n\n' + env);
    let checkParameters = (req, res) => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(req.body.name) || check.isEmpty(req.body.email) || check.isEmpty(req.body.password)) {
                logger.error('1 or more parameters are missing', 'userController:register=>checkParameters', 8);
                let apiResponse = response.generate(true, '1 or more parameters are missing', 400, null);
                reject(apiResponse);
            } else {
                UserModel.findOne({ 'email': req.body.email.trim().toLowerCase() },
                    (err, result) => {
                        if (err) {
                            logger.error(err, 'userController : register => Check Parameters', 10);
                            let apiResponse = response.generate(true, 'Email find err ' + err, 400, null);
                            reject(apiResponse);
                        } else if (check.isEmpty(result)) {
                            resolve();
                        } else {
                            logger.error('Email already exist', 'userController : register => Check Parameters', 10);
                            let apiResponse = response.generate(true, 'Email already exist', 400, null);
                            reject(apiResponse);
                        }
                    });
            }
        });
    }; //end of checkParameters

    let saveData = () => {
        
        return new Promise((resolve, reject) => {

            let dirName = path.join(__dirname, '../../uploads')

            let user = new UserModel({
                userId: shortid.generate(),
                name: titleCase(req.body.name.trim()),
                email: req.body.email,
                password: passwordLib.hashpassword(req.body.password),
                provider: "local",
                providerId: "",
                photoUrl: req.file.filename,
                createdOn: time.getLocalTime()
            });
            //console.log('user')
            //console.log(user)

            //save to db
            user.save((err, result) => {
                if (err) {
                    ////console.log(err)
                    logger.error(err.message, 'userController:register=>saveData', 10);
                    let apiResponse = response.generate(true, 'Unable to register user', 400, null);
                    reject(apiResponse);
                } else {
                    let userCreated = result.toObject();
                    //console.log('userCreated')
                    //console.log(userCreated)
                    resolve(userCreated);
                }
            });
        });
    }; //end of saveData
    checkParameters(req, res)
        .then(saveData)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'You are successfully registerd', 200, resolve)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            let dirName = path.join(__dirname, '../../uploads')
            var filePath = `${dirName}/${req.file.filename}`;
            fs.unlinkSync(filePath);

            logger.error(err, 'While registering user', 10);
            res.status(err.status || 500)
            res.send(err)
        });
}; //end of register function

module.exports = {
    loginFunction: loginFunction,
    signInSocial: signInSocial,
    getAllUsers: getAllUsersFunction,
    createIssue: createIssueFunction,
    register: register
}