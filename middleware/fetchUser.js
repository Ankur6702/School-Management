const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// To verify that the user has admin rights
const fetchAdmin = async (req, res, next) => {
    const token = req.header('token');
    const bearer = req.header('Authorization').split(' ')[1];
    if (!token && !bearer) {
        return res.status(401).json({
            status: 'error',
            message: 'No token, authorization denied'
        });
    }
    try {
        let decoded;
        if(bearer) {
            decoded = jwt.verify(bearer, JWT_SECRET);
        } else {
            decoded = jwt.verify(token, JWT_SECRET);
        }
        req.user = decoded;
        if (req.user.isAdmin) {
            next();
        } else {
            return res.status(401).json({
                status: 'error',
                message: 'You are not authorized to access this resource'
            });
        }
    }
    catch (error) {
        res.status(401).json({
            status: 'error',
            message: 'Token is not valid'
        });
    }
};


// To verify that the user has teacher rights
const fetchTeacher = async (req, res, next) => {
    const token = req.header('token');
    const bearer = req.header('Authorization').split(' ')[1];
    if (!token && !bearer) {
        return res.status(401).json({
            status: 'error',
            message: 'No token, authorization denied'
        });
    }
    try {
        let decoded;
        if(bearer) {
            decoded = jwt.verify(bearer, JWT_SECRET);
        } else {
            decoded = jwt.verify(token, JWT_SECRET);
        }
        req.user = decoded;
        if (req.user.isTeacher) {
            next();
        } else {
            return res.status(401).json({
                status: 'error',
                message: 'You are not authorized to access this resource'
            });
        }
    }
    catch (error) {
        res.status(401).json({
            status: 'error',
            message: 'Token is not valid'
        });
    }
}


// To verify that the user has student rights
const fetchStudent = async (req, res, next) => {
    const token = req.header('token');
    const bearer = req.header('Authorization').split(' ')[1];
    if (!token && !bearer) {
        return res.status(401).json({
            status: 'error',
            message: 'No token, authorization denied'
        });
    }
    try {
        let decoded;
        if(bearer) {
            decoded = jwt.verify(bearer, JWT_SECRET);
        } else {
            decoded = jwt.verify(token, JWT_SECRET);
        }
        req.user = decoded;
        if (req.user.isStudent) {
            next();
        } else {
            return res.status(401).json({
                status: 'error',
                message: 'You are not authorized to access this resource'
            });
        }
    }
    catch (error) {
        res.status(401).json({
            status: 'error',
            message: 'Token is not valid'
        });
    }
}

module.exports = { fetchAdmin, fetchTeacher, fetchStudent };
