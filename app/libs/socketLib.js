
const express = require('express')
const events = require('events')
const eventEmitter = new events.EventEmitter() //new eventEmitter instance
const socketio = require('socket.io')
const shortid = require('shortid')
//const response = require('./response')
const logger = require('./loggerLib')
const mongoose = require('mongoose')
const tokenLib = require('./tokenLib')
const check = require('./checkLib')

const FriendListModel = require('../models/FriendList');
//here server is http server initialized in app.js
let setServer = (server) => {

    //socket initialization
    let io = socketio.listen(server)
    let myIo = io.of('') //no namespace

    //main event handler,inside this series of events can be handled
    myIo.on('connection', (socket) => {
        console.log("on connection success => emitting verify user");
        socket.emit("verifyUser", ""); //event emit=>listening on frontend

        //to set user via verifying authToken received via verifyUser event
        //event set-user listening emitted on frontend
        socket.on('set-user', (authToken) => {
            console.log("set-user called")
            if (check.isEmpty(authToken)) {
                console.log('Empty authToken')
            } else {
                tokenLib.verifyClaimWithoutSecret(authToken, (err, user) => {
                    if (err) {
                        socket.emit('auth-error', {
                            status: 500,
                            error: 'Please provide correct auth token'
                        })
                    } else {

                        console.log("user is verified..setting details");
                        let currentUser = user.data;
                        console.log(currentUser)
                        // setting socket user id 
                        socket.userId = currentUser.userId
                        let fullName = `${currentUser.firstName} ${currentUser.lastName}`
                        let key = currentUser.userId
                        let value = fullName

                    }
                })
            }
        })

        //event listening
        //friend-info event emitted from frontend
        socket.on('friend-info', (senderInfo) => {
            console.log(senderInfo);

            let notification = {
                senderId: senderInfo.senderId,
                receiverId: senderInfo.receiverId,
                message: `You have received friend request from ${senderInfo.userName}`
            }
            //emit receiverId event across all(pipes) passing notifcation
            //on frontend userId matching receiverId will receive data
            myIo.emit(senderInfo.receiverId, notification)
        }) //end socket listening with event(friend-info)

        socket.on('accept-request', (receiverInfo) => {
            console.log(receiverInfo)
            let notification = {
                senderId: receiverInfo.senderId,
                message: `${receiverInfo.userName} has accepted your request`
            }
            myIo.emit('fRAccept'+receiverInfo.senderId, notification)
        }) //end socket listening

        socket.on('multi-todo-create', (data) => {
            FriendListModel.find({
                    'senderId': data.senderId
                })
                .select('receiverId')
                .lean()
                .exec((err, result) => {
                    if (result && result.length > 0) {

                        console.log('result')
                        console.log(result)
                        for (let d of result) {
                            console.log('\n\ncreate' + d.receiverId)
                            myIo.emit('create' + d.receiverId, data.message);
                        }
                    }
                })
        })

        socket.on('logout',(userId)=>{
            socket.disconnect();
        })
        socket.on('disconnect', () => {
            console.log('user is disconnected');
            console.log(socket.userId);
        }) //end of on disconnect

    }) //end main socket 'connection
} //end setServer


module.exports = {
    setServer: setServer
}