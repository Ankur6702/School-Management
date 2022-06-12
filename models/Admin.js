const mongoose = require('mongoose');
const { Schema } = mongoose;

const AdminSchema = new Schema({
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
    isAdmin: {
        type: Boolean,
        default: true,
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('admin', AdminSchema);