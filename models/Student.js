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
    scorecards: [{
        type: Schema.Types.ObjectId,
        ref: 'scorecard'
    }],
    totalScore: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
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
    }
});

module.exports = mongoose.model('student', StudentSchema);