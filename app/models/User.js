'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let userSchema = new Schema({
    userId: {
        type: String,
        default: '',
        index: true,
        unique: true
    },
    name: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        default: ''
    },
    provider: {
        type: String,
        default: ''
    },
    providerId: {
        type: String,
        default: ''
    },
    photoUrl: {
        type: String,
        default: ''
    },
    createdOn: {
        type: Date,
        default: ""
    }
})


mongoose.model('User', userSchema);