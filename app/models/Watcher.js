'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let watcherSchema = new Schema({
    issueId: {
        type: String,
        required: true
    },
    watcherId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    createdOn: {
        type: Date,
        default: ''
    }
})


mongoose.model('Watcher', watcherSchema);