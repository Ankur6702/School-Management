const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;


function validatePassword(data) {
    var password = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,15}$/;
    if (password.test(data)) {
        return true;
    }
    else {
        return false;
    }
}


// To register a new admin
router.post('/signup', [
    body('name', 'Name is required').not().isEmpty(),
    body('email').isEmail(),
    body('password', 'Password is required').not().isEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    if(validatePassword(req.body.password) === false) {
        return res.status(400).json({ status: 'error', message: "Password should be of 8 characters long and should be less than 16 characters. It should contain at least one uppercase, one lowercase, and one number" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    try {
        const admin = await Admin.create({
            name: req.body.name,
            isAdmin: req.body.isAdmin,
            email: req.body.email,
            password: hashedPassword,
        });
        res.status(200).json({ status: 'success', message: 'Admin created', admin });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To login a student, teacher or admin
router.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').exists(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    try {
        const admin = await Admin.findOne({ email: req.body.email });
        const teacher = await Teacher.findOne({ email: req.body.email });
        const student = await Student.findOne({ email: req.body.email });
        if (admin === null && teacher === null && student === null) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        if (teacher === null && student === null) {
            const isMatch = await bcrypt.compare(req.body.password, admin.password);
            if (isMatch) {
                const token = jwt.sign({ id: admin._id, isAdmin: true }, JWT_SECRET);
                res.status(200).json({ status: 'success', message: 'Admin logged in', token });
            } else {
                return res.status(400).json({ status: 'error', message: 'Incorrect password' });
            }
        }

        if (teacher !== null) {
            const isMatch2 = await bcrypt.compare(req.body.password, teacher.password);
            if (isMatch2) {
                const token = jwt.sign({ id: teacher._id, isAdmin: teacher.isAdmin, isTeacher: true }, JWT_SECRET);
                res.status(200).json({ status: 'success', message: 'Teacher logged in', token });
            } else {
                return res.status(400).json({ status: 'error', message: 'Incorrect password' });
            }
        }

        if (student !== null) {
            const isMatch3 = await bcrypt.compare(req.body.password, student.password);
            if (isMatch3) {
                const token = jwt.sign({ id: student._id, isAdmin: student.isAdmin, isStudent: true }, JWT_SECRET);
                res.status(200).json({ status: 'success', message: 'Student logged in', token });
            } else {
                return res.status(400).json({ status: 'error', message: 'Incorrect password' });
            }
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router