// Npm Packages
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Models
const Scorecard = require('../models/Scorecard');
const Student = require('../models/Student');

// Local functions
const { fetchStudent } = require('../middleware/fetchUser');
const logger = require('../logger');

// ===========================================Controllers=====================================================

// To get all the scorecards of a student sorted latest to oldest
router.get('/scorecards', fetchStudent, async (req, res) => {
    logger.info('Fetch scorecards request received');
    try {
        const scorecards = await Scorecard.find({ student: req.user.id }).sort({ examDate: -1 });
        if (scorecards.length === 0) {
            logger.info('No scorecards found');
            res.status(200).json({ status: 'success', message: 'No scorecards found' });
        }
        logger.info('Fetched scorecards successfully');
        logger.debug('Scorecards details: ' + scorecards);
        res.status(200).json({ status: 'success', scorecards });
    } catch (error) {
        logger.error('Fetch scorecards failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To fetch student's profile
router.get('/fetchProfile', fetchStudent, async (req, res) => {
    logger.info('Fetch profile request received');
    try {
        const student = await Student.findById(req.user.id || req.user._id);
        if(!student) {
            logger.error('Fetch profile failed: Student not found');
            res.status(404).json({ status: 'error', message: 'Student not found' });
        }
        logger.info('Fetch profile successful');
        logger.debug('Student details: ' + student);
        res.status(200).json({ status: 'success', student });
    } catch (error) {
        logger.error('Fetch profile failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To update student profile
router.put('/updateProfile', fetchStudent, [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('phone').not().isEmpty().isMobilePhone('en-IN').withMessage('Phone number is invalid'),
    body('address').not().isEmpty().withMessage('Address is required'),
    body('dob').not().isEmpty().isDate().withMessage('Date of birth is invalid'),
    body('gender').not().isEmpty().withMessage('Gender is required'),
], async (req, res) => {
    logger.info('Update Student Profile request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Update Student Profile request failed', errors.array());
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
        logger.info('Update Student Profile successful');
        logger.debug('Student details: ' + student);
        res.status(200).json({ status: 'success', student });
    } catch (error) {
        logger.error('Update Student Profile failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});


module.exports = router;