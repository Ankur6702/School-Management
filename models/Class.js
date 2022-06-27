const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClassSchema = new Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'admin',
    },
    name: {
        type: String,
        required: true,
        unique: true,
        minlength: 2,
        maxlength: 5
    },
    capacity: {
        type: Number,
        required: true,
        default: 20,
        min: 20,
        max: 100
    },
    students: [{
        type: Schema.Types.ObjectId,
        ref: 'student'
    }],
    teachers: [{
        type: Schema.Types.ObjectId,
        ref: 'teacher'
    }],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('class', ClassSchema);