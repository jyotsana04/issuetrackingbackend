'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let commentSchema = new Schema({
    issueId: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    createdOn: {
        type: Date,
        default: ''
    }
})


mongoose.model('Comment', commentSchema);