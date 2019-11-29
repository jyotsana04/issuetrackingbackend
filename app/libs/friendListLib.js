const mongoose = require('mongoose')
const IssueModel = mongoose.model('Issue');

const WatcherModel = mongoose.model('Watcher');


let getAllFriendsId = (id, cb) => {
    IssueModel.find({
            $or: [
                { assignedTo: id },
                { createdBy: id }
            ]
        })
        .select().lean()
        .exec((err, result) => {
            WatcherModel.find({ watcherId: id })
                .select().lean().exec((e, watch) => {
                    var issueData = [];
                    result.forEach(d => {
                        issueData.push(d.issueId);
                    });

                    watch.forEach(d => {
                        issueData.push(d.issueId);
                    })

                    let unique = [...new Set(issueData)];
                    cb(null, unique);
                });
        });

    
};

module.exports = {
    getAllFriendsId: getAllFriendsId
        
};