const express = require('express');
const router = express.Router();
const Scorecard = require('../models/Scorecard');
const Student = require('../models/Student');
const { body, validationResult } = require('express-validator');
const { fetchStudent } = require('../middleware/fetchUser');

// To get all the scorecards of a student sorted latest to oldest
router.get('/scorecards', fetchStudent, async (req, res) => {
    try {
        const scorecards = await Scorecard.find({ student: req.user.id }).sort({ examDate: -1 });
        res.status(200).json({ status: 'success', scorecards });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// To fetch student's profile
router.get('/fetchProfile', fetchStudent, async (req, res) => {
    try {   
        const student = await Student.findById(req.user.id || req.user._id);
        res.status(200).json({ status: 'success', student });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To update student profile
router.put('/updateProfile', fetchStudent, [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('phone').not().isEmpty().isMobilePhone('en-IN').withMessage('Phone number is invalid'),
    body('address').not().isEmpty().withMessage('Address is required'),
    body('dob').not().isEmpty().isDate().withMessage('Date of birth is invalid'),
    body('gender').not().isEmpty().withMessage('Gender is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    // let age = new Date().getFullYear() - new Date(req.body.dob).getFullYear();
    // if (new Date().getMonth() < new Date(req.body.dob).getMonth()) {
    //     age--;
    // }
    // if(new Date().getMonth() === new Date(req.body.dob).getMonth() && new Date().getDate() < new Date(req.body.dob).getDate()) {
    //     age--;
    // }
    try {
        const student = await Student.findByIdAndUpdate(req.user.id, req.body, { new: true });
        res.status(200).json({ status: 'success', student });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
