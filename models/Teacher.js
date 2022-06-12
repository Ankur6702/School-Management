const mongoose = require('mongoose');
const { Schema } = mongoose;

const TeacherSchema = new Schema({
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
    classes: [{
        type: Schema.Types.ObjectId,
        ref: 'class'
    }],
    isAdmin: {
        type: Boolean,
        default: false,
        required: false
    },
    isTeacher: {
        type: Boolean,
        default: true,
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('teacher', TeacherSchema);