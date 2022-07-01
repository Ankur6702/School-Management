const mongoose = require('mongoose');
const { Schema } = mongoose;

const BookSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    details: [{
        issuedBy: {
            type: Schema.Types.ObjectId,
            ref: 'student'
        },
        issueDate: {
            type: Date,
            default: Date.now
        },
        returnDate: {
            type: Date,
            default: null
        }
    }],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('book', BookSchema);