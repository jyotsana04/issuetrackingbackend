const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const time = require('../libs/timeLib');

const Issue = new Schema({
    issueId: {
        type: String,
        unique: true,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    attachment: {
        type: Array
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    modifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    createdOn: {
        type: Date,
    },
    lastModifiedOn: {
        type: Date
    },
    status: {
        type: String,
        default: 'In-Progress'
    }
})

module.exports = mongoose.model('Issue', Issue);