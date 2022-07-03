// Npm Packages
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Models
const Student = require('../models/Student');
const Scorecard = require('../models/Scorecard');
const Teacher = require('../models/Teacher');

// Local functions
const { fetchTeacher } = require('../middleware/fetchUser');
const logger = require('../logger');

// ===========================================Controllers=====================================================

// Fetch students sorted in ascending order by name
router.get('/students', fetchTeacher, async (req, res) => {
    logger.info('Fetch students request received');
    try {
        const students = await Student.find({}).sort({ name: 1 });
        if (students.length === 0) {
            logger.info('No students found');
            res.status(200).json({ status: 'success', message: 'No students found' });
        }
        logger.info('Fetched students successfully');
        logger.debug('Students details: ' + students);
        res.status(200).json({ status: 'success', students });
    } catch (error) {
        logger.error('Fetch students failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To fetch teacher's profile
router.get('/fetchProfile', fetchTeacher, async (req, res) => {
    logger.info('Fetch profile request received');
    try {
        const teacher = await Teacher.findById(req.user.id || req.user._id);
        logger.info('Fetch profile successful');
        logger.debug('Teacher details: ' + teacher);
        res.status(200).json({ status: 'success', teacher });
    } catch (error) {
        logger.error('Fetch profile failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To update teacher profile
router.put('/updateProfile', fetchTeacher, [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('phone').not().isEmpty().isMobilePhone('en-IN').withMessage('Phone number is invalid'),
    body('address').not().isEmpty().withMessage('Address is required'),
    body('dob').not().isEmpty().isDate().withMessage('Date of birth is invalid'),
    body('gender').not().isEmpty().withMessage('Gender is required'),
    body('subjectToTeach').not().isEmpty().withMessage('Subject is required'),
    body('qualification').isEmpty().withMessage('Subject is required'),
], async (req, res) => {
    logger.info('Update profile request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Update profile failed: ', errors.array());
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    try {
        const teacher = await Teacher.findByIdAndUpdate(req.user.id, req.body, { new: true });
        logger.info('Updated profile successfullly');
        logger.debug('Teacher details: ' + teacher);
        res.status(200).json({ status: 'success', teacher });
    } catch (error) {
        logger.error('Update profile failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To create a new scorecard of a particular subject for a student
router.post('/scorecard/student/:id', fetchTeacher, [
    body('subject').not().isEmpty().withMessage('Subject is required'),
    body('score').not().isEmpty().withMessage('Score is required'),
    body('comments').not().isEmpty().withMessage('Comments is required'),
    body('examDate').not().isEmpty().withMessage('Exam date is required in the format YYYY-MM-DD')
], async (req, res) => {
    logger.info('Create scorecard request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Create scorecard failed: ', errors.array());
        return res.status(400).json({ status: 'error', message: errors.array() });
    }

    const { subject, score, comments, examDate } = req.body;
    const studentId = req.params.id;

    try {
        const student = await Student.findById(studentId);
        if (!student) {
            logger.error('Student not found');
            return res.status(404).json({ status: 'error', message: 'Student not found' });
        }
        const isExist = await Scorecard.findOne({ student: studentId, subject: subject, examDate: examDate });
        if (isExist) {
            logger.error('Scorecard already exists');
            return res.status(400).json({ status: 'error', message: 'Scorecard already exist' });
        }
        const scorecard = new Scorecard({
            student: studentId,
            subject,
            score,
            comments,
            examDate,
            createdBy: req.user.id
        });

        student.scorecards.push(scorecard);
        student.totalScore += score;
        await student.save();
        await scorecard.save();

        logger.info('Created scorecard successfully');
        logger.debug('Scorecard details: ' + scorecard);
        res.status(200).json({ status: 'success', message: 'Scorecard created successfully' });
    }
    catch (error) {
        logger.error('Create scorecard failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To update a scorecard for a student
router.put('/scorecard/:id', fetchTeacher, [
    body('subject').not().isEmpty().withMessage('Subject is required'),
    body('score').not().isEmpty().withMessage('Score is required'),
    body('comments').not().isEmpty().withMessage('Comments is required'),
    body('examDate').not().isEmpty().withMessage('Exam date is required in the format YYYY-MM-DD')
], async (req, res) => {
    logger.info('Update scorecard request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Update scorecard failed: ', errors.array());
        return res.status(400).json({ status: 'error', message: errors.array() });
    }

    const { subject, score, comments, examDate } = req.body;
    const scorecardId = req.params.id;

    try {
        const scorecard = await Scorecard.findById(scorecardId);
        const student = await Student.findById(scorecard.student);
        if (!scorecard) {
            logger.error('Scorecard not found');
            return res.status(404).json({ status: 'error', message: 'Scorecard not found' });
        }
        if (scorecard.createdBy !== req.user.id) {
            logger.error('You are not authorized to update this scorecard');
            return res.status(401).json({ status: 'error', message: 'You are not authorized to update this scorecard' });
        }

        student.totalScore -= scorecard.score;
        student.totalScore += score;

        scorecard.subject = subject;
        scorecard.score = score;
        scorecard.comments = comments;
        scorecard.examDate = examDate;

        await student.save();
        await scorecard.save();

        logger.info('Updated scorecard successfully');
        logger.debug('Scorecard details: ' + scorecard);
        res.status(200).json({ status: 'success', message: 'Scorecard updated successfully' });
    }
    catch (error) {
        logger.error('Update scorecard failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To delete a scorecard for a student
router.delete('/scorecard/:id', fetchTeacher, async (req, res) => {
    logger.info('Delete scorecard request received');
    const scorecardId = req.params.id;
    try {
        const scorecard = await Scorecard.findById(scorecardId);
        const student = await Student.findById(scorecard.student);
        if (!scorecard) {
            logger.error('Scorecard not found');
            return res.status(404).json({ status: 'error', message: 'Scorecard not found' });
        }
        if (scorecard.createdBy !== req.user.id) {
            logger.error('You are not authorized to delete this scorecard');
            return res.status(401).json({ status: 'error', message: 'You are not authorized to delete this scorecard' });
        }
        student.totalScore -= scorecard.score;
        student.scorecards = student.scorecards.filter(sc => sc.id !== scorecardId);
        await student.save();
        await scorecard.remove();

        logger.info('Deleted scorecard successfully');
        logger.debug('Scorecard details: ' + scorecard);
        res.status(200).json({ status: 'success', message: 'Scorecard deleted successfully' });
    }
    catch (error) {
        logger.error('Delete scorecard failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To fetch rankings of students based on the average score
router.get('/rankings', fetchTeacher, async (req, res) => {
    logger.info('Fetch rankings request received');
    try {
        const students = await Student.find({});
        if (students.length === 0) {
            logger.error('No students found');
            return res.status(404).json({ status: 'error', message: 'No students found' });
        }

        const studentsWithScorecards = students.filter(student => student.scorecards.length > 0);
        const studentsWithoutScorecards = students.filter(student => student.scorecards.length === 0);
        const rankings = studentsWithScorecards.sort((a, b) => b.totalScore / b.scorecards.length - a.totalScore / a.scorecards.length);
        
        rankings.push(...studentsWithoutScorecards);

        logger.info('Fetched rankings successfully');
        logger.debug('Rankings: ' + rankings);
        res.status(200).json({ status: 'success', rankings });
    } catch (error) {
        logger.error('Fetch rankings failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To fetch all scorecards
router.get('/fetchScorecards', fetchTeacher, async (req, res) => {
    logger.info('Fetch scorecards request received');
    try {
        const scorecards = await Scorecard.find({});
        if (scorecards.length === 0) {
            logger.error('No scorecards found');
            return res.status(404).json({ status: 'error', message: 'No scorecards found' });
        }

        logger.info('Fetched scorecards successfully');
        logger.debug('Scorecards: ' + scorecards);
        res.status(200).json({ status: 'success', scorecards });
    } catch (error) {
        logger.error('Fetch scorecards failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;