const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = () => {
    mongoose.connect(process.env.MONGO_URI, () => {
        console.log("Connected to Mongo Successfully");
    })
}
module.exports = connectDB;