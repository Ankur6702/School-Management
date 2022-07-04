// Npm Packages
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');

// Models
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// Local functions
const { sendResetPasswordMail } = require('../utils/mailer');
const logger = require('../logger');

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// ===========================================Controllers=====================================================

// To register a new admin
router.post('/signup', [
    body('name', 'Name is required').not().isEmpty(),
    body('email').isEmail(),
    body('password', 'Password is required').not().isEmpty(),
], async (req, res) => {
    logger.info('Signup request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Signup request failed');
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    if (validatePassword(req.body.password) === false) {
        return res.status(400).json({ status: 'error', message: "Password should be of 8 characters long and should be less than 16 characters. It should contain at least one uppercase, one lowercase, and one number" });
    }
    const salt = bcrypt.genSalt(process.env.SALT_ROUNDS);
    const hashedPassword = bcrypt.hash(req.body.password, salt);
    try {
        const admin = await Admin.create({
            name: req.body.name,
            isAdmin: req.body.isAdmin,
            email: req.body.email,
            password: hashedPassword,
        });
        logger.info('Signup successful');
        logger.debug('Admin details: ' + admin);
        res.status(200).json({ status: 'success', message: 'Admin created', admin });
    } catch (error) {
        logger.error('Signup failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To login a student, teacher or admin
router.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').exists(),
], async (req, res) => {
    logger.info('Login request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Login request failed');
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    try {
        const admin = await Admin.findOne({ email: req.body.email });
        const teacher = await Teacher.findOne({ email: req.body.email });
        const student = await Student.findOne({ email: req.body.email });
        if (admin === null && teacher === null && student === null) {
            logger.error('Login failed: No user found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        if (teacher === null && student === null) {
            logger.info('Processing admin login');
            const isMatch = await bcrypt.compare(req.body.password, admin.password);
            if (isMatch) {
                const token = jwt.sign({ id: admin._id, isAdmin: true }, JWT_SECRET);
                logger.info('Admin login successful');
                logger.debug('Admin details: ' + admin);
                res.status(200).json({ status: 'success', message: 'Admin logged in', token });
            } else {
                logger.error('Login failed: Password incorrect');
                return res.status(400).json({ status: 'error', message: 'Incorrect password' });
            }
        }

        if (teacher !== null) {
            logger.info('Processing teacher login');
            const isMatch2 = await bcrypt.compare(req.body.password, teacher.password);
            if (isMatch2) {
                const token = jwt.sign({ id: teacher._id, isAdmin: teacher.isAdmin, isTeacher: true, isLibrarian: teacher.isLibrarian }, JWT_SECRET);
                logger.info('Teacher login successful');
                logger.debug('Teacher details: ' + teacher);
                res.status(200).json({ status: 'success', message: 'Teacher logged in', token });
            } else {
                logger.error('Login failed: Password incorrect');
                return res.status(400).json({ status: 'error', message: 'Incorrect password' });
            }
        }

        if (student !== null) {
            logger.info('Processing student login');
            const isMatch3 = await bcrypt.compare(req.body.password, student.password);
            if (isMatch3) {
                const token = jwt.sign({ id: student._id, isAdmin: student.isAdmin, isStudent: true }, JWT_SECRET);
                logger.info('Student login successful');
                logger.debug('Student details: ' + student);
                res.status(200).json({ status: 'success', message: 'Student logged in', token });
            } else {
                logger.error('Login failed: Password incorrect');
                return res.status(400).json({ status: 'error', message: 'Incorrect password' });
            }
        }
    } catch (error) {
        logger.error('Login failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// Forgot Password - Admin
router.post('/forgot-password', [
    body('email', 'Enter a valid email').isEmail(),
], async (req, res) => {
    logger.info('Forgot password request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Forgot password request failed');
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    try {
        logger.info('Processing forgot password request');
        const admin = await Admin.findOne({ email: req.body.email });
        logger.debug('Admin details: ' + admin);
        if (admin === null) {
            logger.error('Forgot password failed: No user found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const token = jwt.sign({ id: admin._id, isAdmin: true }, JWT_SECRET, { expiresIn: '20m' });
        logger.debug('Token: ' + token);

        sendResetPasswordMail(admin.email, admin.name, token);
        res.status(200).json({ status: 'success', message: 'Password reset link sent to your email' });
    } catch (error) {
        logger.error('Forgot password request failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// GET-Reset Password - Admin
router.get('/reset-password/:token', async (req, res) => {
    logger.info('Reset password token received');
    try {
        logger.info('Processing request further');
        const decode = jwt.verify(req.params.token, JWT_SECRET);
        logger.debug('Decoded token: ' + decode);


        const admin = await Admin.findOne({ _id: decode.id });
        logger.debug('Admin details: ' + admin);
        if (admin === null) {
            logger.error('Reset password failed: No user found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.status(200).json({ status: 'success', message: 'Verified, now you can enter new password', token: req.params.token });
    } catch (error) {
        logger.error('Reset password request failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// POST-Reset Password - Admin
router.post('/reset-password/:token', [
    body('password', 'Password cannot be blank').exists(),
    body('confirmPassword', 'Passwords do not match').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
], async (req, res) => {
    logger.info('Reset password request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Reset password request failed');
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    if (validatePassword(req.body.password) === false) {
        return res.status(400).json({ status: 'error', message: "Password should be of 8 characters long and should be less than 16 characters. It should contain at least one uppercase, one lowercase, and one number" });
    }
    try {
        logger.info('Processing reset password request');
        const decoded = jwt.verify(req.params.token, JWT_SECRET);
        logger.debug('Decoded token: ' + decoded);

        const admin = await Admin.findOne({ _id: decoded.id });
        logger.debug('Admin found: ' + admin);
        if (admin === null) {
            logger.error('Reset password failed: No user found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const salt = bcrypt.genSalt(process.env.SALT_ROUNDS);
        const hashedPassword = bcrypt.hash(req.body.password, salt);

        logger.debug('Hashed password: ' + hashedPassword);
        admin.password = hashedPassword;
        await admin.save();
        
        logger.info('Reset password successful');
        logger.debug('Admin details: ' + admin);
        res.status(200).json({ status: 'success', message: 'Password reset' });
    } catch (error) {
        logger.error('Reset password failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ===================================================Functions==================================================

function validatePassword(data) {
    logger.info('Inside Password Validation');
    var password = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,15}$/;
    if (password.test(data)) {
        logger.info('Password validation successful');
        return true;
    }
    else {
        logger.error('Password validation failed');
        return false;
    }
}

module.exports = router