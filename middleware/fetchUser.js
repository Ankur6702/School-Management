const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const logger = require('../logger');
const JWT_SECRET = process.env.JWT_SECRET;

dotenv.config();

// To verify that the user has admin rights
const fetchAdmin = async (req, res, next) => {
    logger.info('Verifying admin rights');
    
    const token = req.header('token');
    logger.debug('JWT Token: ', token);
    
    let bearer = req.header('Authorization');
    if(bearer !== undefined) {
        bearer = bearer.split(' ')[1];
        logger.debug('Bearer token: ', bearer);
    }
    
    if (!token && !bearer) {
        logger.error('No token, authorization denied');
        return res.status(401).json({
            status: 'error',
            message: 'No token, authorization denied'
        });
    }
    
    try {
        let decoded;
        if(bearer) {
            decoded = jwt.verify(bearer, JWT_SECRET);
            logger.debug('Decoded Bearer token: ', decoded);
        } else {
            decoded = jwt.verify(token, JWT_SECRET);
            logger.debug('Decoded JWT token: ', decoded);
        }

        req.user = decoded;
        if (req.user.isAdmin) {
            logger.info('Admin rights verified');
            next();
        } else {
            logger.error('You are not authorized to access this resource');
            return res.status(401).json({
                status: 'error',
                message: 'You are not authorized to access this resource'
            });
        }
    } catch (error) {
        logger.error('Token is not valid: ', error);
        res.status(401).json({
            status: 'error',
            message: 'Token is not valid'
        });
    }
};


// To verify that the user has teacher rights
const fetchTeacher = async (req, res, next) => {
    logger.info('Verifying teacher rights');
    
    const token = req.header('token');
    logger.debug('JWT Token: ', token);
    
    let bearer = req.header('Authorization');
    if(bearer !== undefined) {
        bearer = bearer.split(' ')[1];
        logger.debug('Bearer token: ', bearer);
    }
    
    if (!token && !bearer) {
        logger.error('No token, authorization denied');
        return res.status(401).json({
            status: 'error',
            message: 'No token, authorization denied'
        });
    }
    
    try {
        let decoded;
        if(bearer) {
            decoded = jwt.verify(bearer, JWT_SECRET);
            logger.debug('Decoded Bearer token: ', decoded);
        } else {
            decoded = jwt.verify(token, JWT_SECRET);
            logger.debug('Decoded JWT token: ', decoded);
        }

        req.user = decoded;
        if (req.user.isTeacher) {
            logger.info('Teacher rights verified');
            next();
        } else {
            logger.error('You are not authorized to access this resource');
            return res.status(401).json({
                status: 'error',
                message: 'You are not authorized to access this resource'
            });
        }
    } catch (error) {
        logger.error('Token is not valid: ', error);
        res.status(401).json({
            status: 'error',
            message: 'Token is not valid'
        });
    }
};


// To verify that the user has student rights
const fetchStudent = async (req, res, next) => {
    logger.info('Verifying student rights');
    
    const token = req.header('token');
    logger.debug('JWT Token: ', token);
    
    let bearer = req.header('Authorization');
    if(bearer !== undefined) {
        bearer = bearer.split(' ')[1];
        logger.debug('Bearer token: ', bearer);
    }
    
    if (!token && !bearer) {
        logger.error('No token, authorization denied');
        return res.status(401).json({
            status: 'error',
            message: 'No token, authorization denied'
        });
    }
    
    try {
        let decoded;
        if(bearer) {
            decoded = jwt.verify(bearer, JWT_SECRET);
            logger.debug('Decoded Bearer token: ', decoded);
        } else {
            decoded = jwt.verify(token, JWT_SECRET);
            logger.debug('Decoded JWT token: ', decoded);
        }

        req.user = decoded;
        if (req.user.isStudent) {
            logger.info('Student rights verified');
            next();
        } else {
            logger.error('You are not authorized to access this resource');
            return res.status(401).json({
                status: 'error',
                message: 'You are not authorized to access this resource'
            });
        }
    } catch (error) {
        logger.error('Token is not valid: ', error);
        res.status(401).json({
            status: 'error',
            message: 'Token is not valid'
        });
    }
};


// To verify that the user has library rights
const fetchLibrarian = async (req, res, next) => {
    logger.info('Verifying library rights');
    
    const token = req.header('token');
    logger.debug('JWT Token: ', token);
    
    let bearer = req.header('Authorization');
    if(bearer !== undefined) {
        bearer = bearer.split(' ')[1];
        logger.debug('Bearer token: ', bearer);
    }
    
    if (!token && !bearer) {
        logger.error('No token, authorization denied');
        return res.status(401).json({
            status: 'error',
            message: 'No token, authorization denied'
        });
    }
    
    try {
        let decoded;
        if(bearer) {
            decoded = jwt.verify(bearer, JWT_SECRET);
            logger.debug('Decoded Bearer token: ', decoded);
        } else {
            decoded = jwt.verify(token, JWT_SECRET);
            logger.debug('Decoded JWT token: ', decoded);
        }

        req.user = decoded;
        if (req.user.isLibrarian) {
            logger.info('Library rights verified');
            next();
        } else {
            logger.error('You are not authorized to access this resource');
            return res.status(401).json({
                status: 'error',
                message: 'You are not authorized to access this resource'
            });
        }
    } catch (error) {
        logger.error('Token is not valid: ', error);
        res.status(401).json({
            status: 'error',
            message: 'Token is not valid'
        });
    }
};

module.exports = { fetchAdmin, fetchTeacher, fetchStudent, fetchLibrarian };