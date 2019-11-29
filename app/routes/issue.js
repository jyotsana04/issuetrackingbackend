const express = require('express');
const router = express.Router();
const issueController = require("../controllers/issueController");
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

var upload = multer({
    storage: storage
});
module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/issues`;

    // params: email, password.
    app.post(`${baseUrl}/get/reportedBy/:assignedTo`, auth.isAuthorized, issueController.getIssuesReporterWise);
    //get all issues
    app.post(`${baseUrl}/get/all`, auth.isAuthorized, issueController.getAllIssue);

    app.get(`${baseUrl}/get/count`, auth.isAuthorized, issueController.getCountDasboard);

    app.get(`${baseUrl}/view/:issueId`, auth.isAuthorized, issueController.viewByIssueId);

    app.post(`${baseUrl}/get/createdby/:createdBy`, auth.isAuthorized, issueController.getAllIssuePostedByUser);

    app.post(`${baseUrl}/create/:issueId/upload`, upload.single('photo'), auth.isAuthorized, issueController.uploadPhoto);
    //delete photo
    app.delete(`${baseUrl}/delete/photo`, auth.isAuthorized, issueController.deletePhoto);

    app.put(`${baseUrl}/:issueId`, auth.isAuthorized, issueController.updateIssue);
    //get notifications
    //app.get(`${baseUrl}/get/notifications`, userController.getNotifications);
    //send friend request
    // app.post(`${baseUrl}/request/create`, userController.sendFriendRequest)
}