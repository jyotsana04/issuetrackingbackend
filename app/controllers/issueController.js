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

var fs = require('fs');
const path = require('path');


/* Models */

const IssueModel = mongoose.model('Issue');
const CommentModel = mongoose.model('Comment');



let getIssuesReporterWise = (req, res) => {
    //console.log(req.body);
    // console.log(req.params);
    let perPage = req.body.length;
    let page = req.body.length * req.body.start;
    // creating find query.

    findQuery = { 'assignedTo': req.params.assignedTo };
    populate = { 'path': 'createdBy' };
    orderColumn = req.body.order[0].column;
    dir = req.body.order[0].dir;

    if (orderColumn === 0) {
        orderColumn = 'title';
    } else if (orderColumn === 3) {
        sort = {}
        populate = { 'path': 'createdBy', 'select': 'name' }
    } else if (orderColumn === 1) {
        orderColumn = 'createdOn';
    } else if (orderColumn === 2) {
        orderColumn = 'status'
    }

    if (orderColumn != 1) {
        sort = {
            [orderColumn]: dir
        };
    }
    //console.log(sort);
    if (!check.isEmpty(req.body.search.value)) {
        findQuery = {
            $and: [
                { 'assignedTo': req.params.assignedTo }
            ],
            $or: [
                { 'title': { '$regex': req.body.search.value, '$options': 'i' } },
                { 'status': { '$regex': req.body.search.value, '$options': 'i' } }
            ]
        };
    }

    //console.log('findQuery')
    //console.log(findQuery)
    IssueModel.count(findQuery, (err, count) => {
        IssueModel.find(findQuery)
            .select('issueId status title createdBy createdOn')
            .populate(populate)
            .sort(sort)
            .limit(perPage)
            .skip(req.body.start)
            .lean()
            .exec((err, result) => {
                if (!err) {
                    dataa = [];
                    result.forEach(element => {
                        element.createdBy = titleCase(element.createdBy.name);
                    });
                    let objToSend = {
                        draw: 0,
                        recordsTotal: count,
                        recordsFiltered: count,
                        data: result
                    };
                    //console.log(objToSend)
                    res.status(200);
                    res.send(objToSend);
                }
            });
    });
}; //end of getIssuesReporterWise

let viewByIssueId = (req, res) => {

    let validateInput = (req, res) => {
        return new Promise((resolve, reject) => {
            if (!check.isEmpty(req.params.issueId)) {
                IssueModel.findOne({ 'issueId': req.params.issueId })
                    .populate('assignedTo')
                    .populate('createdBy')
                    .exec((err, result) => {
                        if (err) {
                            logger.error(err, 'issueController: viewByIssueId => validateInput', 10);
                            let apiResponse = response.generate(true, err, 500, null);
                            reject(apiResponse);
                        } else if (check.isEmpty(result)) {
                            logger.info('No data found', 'issueController: viewByIssueId => validateInput');
                            let apiResponse = response.generate(false, 'No data found', 204, null);
                            reject(apiResponse);
                        } else {
                            resolve(result);
                        }
                    });
            } else {
                logger.error('Issue id is missing in the request', 'issueController: viewByIssueId => validateInput', 10);
                let apiResponse = response.generate(true, 'Issue is is missing in the request', 400, null);
                reject(apiResponse);
            }
        });
    }; //end of validateInput

    //.then(fetchComments)
    validateInput(req, res)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Data Found', 200, resolve);
            res.status(200);
            res.send(apiResponse);
        })
        .catch((err) => {
            logger.error(err, 'While fetching issue', 10);
            res.send(err)
        });
}; //end of viewByIssueId

let deletePhoto = (req, res) => {

    //to validate if exists => issue id and photo url in the req
    let validateParameters = (req, res) => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(req.query.issueId)) {
                logger.error('Issue id is missing in the request', 'issueController : DeletePhoto=> validateParameters', 10);
                let apiResponse = response.generate(true, 'Issue id is missing in the request', 400, null);
                reject(apiResponse);
            } else if (check.isEmpty(req.query.photo)) {
                logger.error('photo url is missing in the request', 'issueController : DeletePhoto=> validateParameters', 10);
                let apiResponse = response.generate(true, 'photo url is missing in the request', 400, null);
                reject(apiResponse);
            } else {
                resolve(req);
            }
        });
    }; //end of validateParameters

    let findAndDeletePhoto = (req) => {
        return new Promise((resolve, reject) => {
            IssueModel.findOne({ 'issueId': req.query.issueId })
                .exec((err, result) => {
                    if (err) {
                        logger.error(err, 'issueController : DeletePhoto=> findAndDeletePhoto', 10);
                        let apiResponse = response.generate(true, err, 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(result)) {
                        logger.error('No record found for the id', 'issueController : DeletePhoto=> findAndDeletePhoto', 10);
                        let apiResponse = response.generate(true, 'No record found for the id', 204, null);
                        reject(apiResponse);
                    } else {
                        let attachments = result.attachment;
                        let index = attachments.findIndex(x => x == req.query.photo);
                        //console.log('\n\n\n\n\n\n\n\n\n\n\n\n' + index)
                        attachments.splice(index, 1);

                        result.markModified('attachment');
                        result.save((err, newData) => {
                            if (err) {
                                //console.log(err)
                                logger.error(err.message, 'issueController: DeletePhoto => findAndDeletePhoto', 10);
                                let apiResponse = response.generate(true, 'Unable to delete photo', 400, null);
                                reject(apiResponse);
                            } else {

                                let dirName = path.join(__dirname, '../../uploads')
                                var filePath = `${dirName}/${req.query.photo}`;
                                fs.unlinkSync(filePath);
                                let newDataObject = newData.toObject();
                                resolve(newDataObject);
                            }
                        });
                    };
                });
        });
    }; //end of find and deletephoto

    validateParameters(req, res)
        .then(findAndDeletePhoto)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'deleted successfully', 200, resolve)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            res.status(err.status)
            res.send(err)
        });
}; //end of deletePhoto

//uploadPhotoFunction
let uploadPhotoFunction = (req, res) => {
    // console.log('req.body')
    // console.log(req.body)
    // console.log('req.file')
    // console.log(req.file)

    let validateParameters = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(req.params.issueId)) {
                logger.error('Issue id is missing in the request', 'issueController : uploadPhotoFunction=> validateParameters', 10);
                let apiResponse = response.generate(true, 'Issue id is missing in the request', 400, null);
                reject(apiResponse);
            } else {
                resolve();
            }
        });
    }; //end of validateParameters

    let findAndUploadPhoto = () => {
        return new Promise((resolve, reject) => {
            IssueModel.findOne({ 'issueId': req.params.issueId })
                .exec((err, result) => {
                    if (err) {
                        logger.error(err, 'issueController : uploadPhotoFunction=> findAndUploadPhoto', 10);
                        let apiResponse = response.generate(true, err, 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(result)) {
                        logger.error('No record found for the id', 'issueController : uploadPhotoFunction=> findAndUploadPhoto', 10);
                        let apiResponse = response.generate(true, 'No record found for the id', 204, null);
                        reject(apiResponse);
                    } else {

                        result.attachment.push(req.file.filename)
                        result.markModified('attachment');
                        result.save((err, newData) => {
                            if (err) {
                                //console.log(err)
                                logger.error(err.message, 'issueController: uploadPhotoFunction => findAndUploadPhoto', 10);
                                let apiResponse = response.generate(true, 'Unable to delete photo', 400, null);
                                reject(apiResponse);
                            } else {
                                let newDataObject = newData.toObject();
                                resolve(newDataObject);
                            }
                        });
                    };
                });
        });
    }; //end of findAndUploadPhoto
    validateParameters()
        .then(findAndUploadPhoto)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Attachment uploaded successfully', 200, resolve)
            res.status(200)
            res.send(apiResponse)
        }).catch((err) => {
            let dirName = path.join(__dirname, '../../uploads')
            var filePath = `${dirName}/${req.file.filename}`;
            fs.unlinkSync(filePath);
            res.status(err.status)
            res.send(err)
        });
    //res.send('Done');
}; //end of uploadPhotoFunction

//update issue using issue id
let updateIssueFunction = (req, res) => {

    let validateParameters = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(req.params.issueId)) {
                logger.error('Issue id is missing in the request', 'issueController : updateIssueFunction=> validateParameters', 10);
                let apiResponse = response.generate(true, 'Issue id is missing in the request', 400, null);
                reject(apiResponse);
            } else if (check.isEmpty(req.body.title)) {
                logger.error('Title is missing in the request', 'issueController : updateIssueFunction=> validateParameters', 10);
                let apiResponse = response.generate(true, 'Title is missing in the request', 400, null);
                reject(apiResponse);
            } else if (check.isEmpty(req.body.description)) {
                logger.error('Issue id is missing in the request', 'issueController : updateIssueFunction=> validateParameters', 10);
                let apiResponse = response.generate(true, 'Title is missing in the request', 400, null);
                reject(apiResponse);
            } else {
                resolve();
            }
        });
    }; //end of validateParameters

    let findAndUpdate = () => {
        return new Promise((resolve, reject) => {
            IssueModel.findOne({ 'issueId': req.params.issueId })
                .exec((err, result) => {
                    if (err) {
                        logger.error(err, 'issueController : updateIssueFunction=> findAndUpdate', 10);
                        let apiResponse = response.generate(true, err, 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(result)) {
                        logger.error('No record found for the id', 'issueController : updateIssueFunction=> findAndUpdate', 10);
                        let apiResponse = response.generate(true, 'No record found for the id', 204, null);
                        reject(apiResponse);
                    } else {
                        result.title = req.body.title.trim();
                        result.description = req.body.description.trim();
                        result.assignedTo = req.body.assignedTo;
                        result.status = req.body.status;
                        result.modifiedBy = req.body.modifiedBy
                        result.save((err, newData) => {
                            if (err) {
                                //console.log(err)
                                logger.error(err.message, 'issueController: updateIssueFunction => findAndUpdate', 10);
                                let apiResponse = response.generate(true, 'Unable to update data', 400, null);
                                reject(apiResponse);
                            } else {
                                let newDataObject = newData.toObject();
                                resolve(newDataObject);
                            }
                        });
                    };
                });
        });
    }; //end of findAndUpdate
    validateParameters()
        .then(findAndUpdate)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'updated successfully', 200, resolve)
            res.status(200)
            res.send(apiResponse)
        }).catch((err) => {
            res.status(err.status)
            res.send(err)
        });;
}; //end of updateIssueFunction


let getAllIssuePostedByUser = (req, res) => {
    //console.log(req.body);
    let perPage = req.body.length;
    let page = req.body.length * req.body.start;
    // creating find query.

    findQuery = { 'createdBy': req.params.createdBy };
    populate = { 'path': 'assignedTo' };
    orderColumn = req.body.order[0].column;
    dir = req.body.order[0].dir;

    if (orderColumn === 0) {
        orderColumn = 'title';
    } else if (orderColumn === 3) {
        sort = {}
        populate = { 'path': 'assignedTo', 'select': 'name' }
    } else if (orderColumn === 1) {
        orderColumn = 'createdOn';
    } else if (orderColumn === 2) {
        orderColumn = 'status'
    }

    //console.log('populate')
    //console.log(populate)
    if (orderColumn != 1) {
        sort = {
            [orderColumn]: dir
        };
    }
    //console.log(sort);
    if (!check.isEmpty(req.body.search.value)) {
        findQuery = {
            $and: [
                { 'createdBy': req.params.createdBy }
            ],
            $or: [
                { 'title': { '$regex': req.body.search.value, '$options': 'i' } },
                { 'status': { '$regex': req.body.search.value, '$options': 'i' } }
            ]
        };
    }

    IssueModel.count(findQuery, (err, count) => {
        IssueModel.find(findQuery)
            .select('issueId status title assignedTo createdOn')
            .populate(populate)
            .sort(sort)
            .limit(perPage)
            .skip(req.body.start)
            .lean()
            .exec((err, result) => {
                if (!err) {
                    dataa = [];
                    result.forEach(element => {
                        element.assignedTo = element.assignedTo.name;
                    });
                    let objToSend = {
                        draw: 0,
                        recordsTotal: count,
                        recordsFiltered: count,
                        data: result
                    };
                    //console.log(objToSend)
                    res.status(200);
                    res.send(objToSend);
                }
            })
    })
}; //end of getAllIssuePostedByUser

let getAllIssue = (req, res) => {
    console.log(req.body);
    let perPage = req.body.length;
    let page = req.body.length * req.body.start;
    // creating find query.

    findQuery = {};
    populate1 = { 'path': 'assignedTo' };
    populate2 = { 'path': 'createdBy' };
    orderColumn = req.body.order[0].column;
    dir = req.body.order[0].dir;

    if (orderColumn === 0) {
        orderColumn = 'title';
    } else if (orderColumn === 1) {
        orderColumn = 'createdOn';
    } else if (orderColumn === 2) {
        orderColumn = 'status'
    }

    //console.log('populate')
    //console.log(populate1)
    if (orderColumn != 1) {
        sort = {
            [orderColumn]: dir
        };
    }
    //console.log(sort);
    if (!check.isEmpty(req.body.search.value)) {
        findQuery = {
            $or: [
                { 'title': { '$regex': req.body.search.value, '$options': 'i' } },
                { 'status': { '$regex': req.body.search.value, '$options': 'i' } }
            ]
        };
    }

    IssueModel.count(findQuery, (error, count) => {
        IssueModel.find(findQuery)
            .select('issueId status title assignedTo createdBy createdOn')
            .populate(populate1)
            .populate(populate2)
            .sort(sort)
            .limit(perPage)
            .skip(req.body.start)
            .lean()
            .exec((err, result) => {
                if (!err) {
                    dataa = [];
                    result.forEach(element => {
                        element.assignedTo = element.assignedTo.name;
                        element.createdBy = element.createdBy.name;
                    });
                    let objToSend = {
                        draw: 0,
                        recordsTotal: count,
                        recordsFiltered: count,
                        data: result
                    };
                    logger.error(result, 'issueController', 10)
                    //console.log(objToSend)
                    res.status(200);
                    res.send(objToSend);
                }
            })
    })
}; //end of get getAllIssue

let getCountDasboard = (req, res) => {
    IssueModel.count({ 'createdBy': req.query.id }, (e1, c1) => {
        IssueModel.count({ 'assignedTo': req.query.id }, (e2, c2) => {
            IssueModel.count((e3, c3) => {
                IssueModel.count({ 'status': 'In-Progress' }, (e4, c4) => {
                    IssueModel.count({ 'status': 'In-Backlog' }, (e5, c5) => {
                        IssueModel.count({ 'status': 'In-Test' }, (e6, c6) => {
                            IssueModel.count({ 'status': 'Done' }, (e7, c7) => {
                                let result = {
                                    createdByUser: c1,
                                    assignedToUser: c2,
                                    allIssues: c3,
                                    inProgress: c4,
                                    inBacklog: c5,
                                    inTest: c6,
                                    inDone: c7
                                };

                                let apiResponse = response.generate(false, 'Found', 200, result);
                                res.send(apiResponse);
                            })
                        })
                    })
                })
            })
        })
    })
};//get Count dashboard EOF
module.exports = {
    getIssuesReporterWise: getIssuesReporterWise,
    viewByIssueId: viewByIssueId,
    deletePhoto: deletePhoto,
    uploadPhoto: uploadPhotoFunction,
    updateIssue: updateIssueFunction,
    getAllIssue: getAllIssue,
    getCountDasboard: getCountDasboard,
    getAllIssuePostedByUser: getAllIssuePostedByUser
}