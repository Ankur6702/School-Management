const mongoose = require('mongoose');
const { Schema } = mongoose;

const StudentSchema = new Schema({
    registeredBy: {
        type: Schema.Types.ObjectId,
        ref: 'admin'
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
    },
    address: {
        type: String,
    },
    dob: {
        type: Date,
    },
    gender: {
        type: String,
    },
    scorecards: [{
        type: Schema.Types.ObjectId,
        ref: 'scorecard'
    }],
    totalScore: {
        type: Number,
        default: 0
    },
    isStudent: {
        type: Boolean,
        default: true,
        required: false
    },
    isAdmin: {
        type: Boolean,
        default: false,
        required: false
    },
    class: {
        type: Schema.Types.ObjectId,
        ref: 'class',
        default: null
    },
    date: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('student', StudentSchema);