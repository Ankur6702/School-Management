const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('./logger');
dotenv.config();

const connectDB = () => {
    mongoose.connect(process.env.MONGO_URI, () => {
        logger.info("Connected to Mongo Successfully");
    })
}
module.exports = connectDB;