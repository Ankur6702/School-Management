const mongoose = require('mongoose');
const { Schema } = mongoose;

const ScorecardSchema = new Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'teacher',
    },
    student: {
        type: Schema.Types.ObjectId,
        ref: 'student'
    },
    subject: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    comments: {
        type: String,
        required: true
    },
    examDate: {
        type: Date,
        required: true,
        min: new Date(2000, 1, 1),
        max: new Date()
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('scorecard', ScorecardSchema);