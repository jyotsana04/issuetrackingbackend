const mongoose = require('mongoose')
const Schema = mongoose.Schema

let socketSchema = new Schema({
    roomName: { type: String, unique: true },
    data: []
});

module.exports = mongoose.model('Socket', socketSchema);