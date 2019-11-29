const mongoose = require('mongoose');
const check = require("./checkLib.js")
const SocketModel = mongoose.model('Socket');

const logger = require('./loggerLib')
const redis = require('redis');
let client = redis.createClient();
    
client.on('connect', () => {

    console.log("Redis connection successfully opened");

});

let getAllUsersInAHash = (hashName, callback) => {
    client.HGETALL(hashName, (err, result) => {
       

        if (err) {
            console.log(err);
            callback(err, null);
        } else if (check.isEmpty(result)) {
            
            callback(null, {});
        } else {
           
            callback(null, result);
        }

    })
}

// function to set new online user
let setANewOnlineUserInHash = (hashName, key, value, callback) => {
    console.log(`setting user ${key} with value in hash ${hashName}`);

    client.HMSET(hashName, [
        key, value
    ], (err, result) => {
        if (err) {
            console.log(err)
            callback(err, null);
        } else {
            console.log("user has been set in the hash map");
            console.log(result);
            callback(null, result);
        }
    })
} 
let getASingleDataFromHash = (hashName, key, callback) => {
    client.HGET(hashName, key, (err, result) => {
        if (err) {
            console.log(err);
            callback(err, null);
        } else if (check.isEmpty(result)) {
            
            callback(null, null);
        } else {
           
            callback(null, result);
        }

    })
}
let deleteUserFromHash = (hashName, key) => {
    client.HDEL(hashName, key);
}

let getAllUsers = (roomName, userId, cb) => {
    SocketModel.findOne({ 'roomName': roomName }, (err, retrievedSocket) => {
        if (err) {
            cb(err, null)
        } else if (retrievedSocket) {
            let socketData = retrievedSocket.data;

            let checkByUserId = socketData.find(x => x.userId === userId);

            if (!checkByUserId) {
                let remData = socketData.filter(x => x.userId === userId);
                retrievedSocket.data = remData;

                retrievedSocket.save((err, updated) => {
                    if (err)
                        cb(err + 'unable to delete old id from server', null)
                    if (updated)
                        cb(null, checkByUserId);
                })
            } else
                cb('no data found for the user id', null)

        }
    });
};//
let setupNewRoom = (roomName, userId, socketId, cb) => {

   
    SocketModel.findOne({ 'roomName': roomName }, (err, result) => {
        if (err) {
            console.log('error hai')
            console.log(err)
            cb(err, null)
        } else if (!check.isEmpty(result)) {
           
            let newObj = {
                userId: userId,
                socketId: socketId
            };
            oldData = result.data;
            let exist = oldData.find(x => x.userId === userId);

            if (exist) {
                cb(null, {})
            } else {
                result.data.push(newObj);
                result.save((err, resp) => {
                    if (err) {
                        cb(err, null);
                    } else {
                        cb(null, resp)
                    }
                })
            }
        } else {
            let newObj = new SocketModel({
                roomName: roomName,
                data: {
                    userId: userId,
                    socketId: socketId
                }
            });
            newObj.save((err, res) => {
                if (err)
                    cb(err, null)
                else if (!res)
                    cb(null, null)
                else {
                    cb(null, res.toObject());
                }
            })
        }
    });
}
module.exports = {
    getAllUsersInAHash: getAllUsersInAHash,
    setANewOnlineUserInHash: setANewOnlineUserInHash,
    deleteUserFromHash: deleteUserFromHash,
    getASingleDataFromHash: getASingleDataFromHash,
    setupNewRoom: setupNewRoom,
    getAllUsers: getAllUsers
}