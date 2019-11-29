const express = require('express');
const userController = require("../controllers/userController");
const appConfig = require("./../../config/appConfig");

const auth = require('./../middlewares/auth')


const multer = require('multer');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})
//const auth = require('../middlewares/auth');

var upload = multer({ storage: storage })
let setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/users`;

    // defining routes.

    
    app.post(`${baseUrl}/register`, upload.single('photo'), userController.register);
    // params: email, password.
    app.post(`${baseUrl}/login`, userController.loginFunction);



    app.post(`${baseUrl}/signInSocial`, userController.signInSocial);

    app.get(`${baseUrl}/get`, auth.isAuthorized, userController.getAllUsers);

    
    app.post(`${baseUrl}/create`, upload.array('photos'), userController.createIssue);


}

module.exports = {
    setRouter:setRouter
}