const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Scorecard = require('../models/Scorecard');
const { body, validationResult } = require('express-validator');
const { fetchTeacher } = require('../middleware/fetchUser');


// Fetch students sorted in ascending order by name
router.get('/students', fetchTeacher, async (req, res) => {
    try {
        const students = await Student.find({}).sort({ name: 1 });
        res.status(200).json({ status: 'success', students });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To create a new scorecard for a student
router.post('/scorecard/student/:id', fetchTeacher, [
    body('subject').not().isEmpty().withMessage('Subject is required'),
    body('score').not().isEmpty().withMessage('Score is required'),
    body('comments').not().isEmpty().withMessage('Comments is required'),
    body('examDate').not().isEmpty().withMessage('Exam date is required in the format YYYY-MM-DD')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', message: errors.array() });
    }

    const { subject, score, comments, examDate } = req.body;
    const studentId = req.params.id;

    try {
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ status: 'error', message: 'Student not found' });
        }
        const isExist = await Scorecard.findOne({ student: studentId, subject: subject, examDate: examDate });
        if (isExist) {
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
        res.status(200).json({ status: 'success', message: 'Scorecard added successfully' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To update a scorecard for a student
router.put('/scorecard/:id', fetchTeacher, [
    body('subject').not().isEmpty().withMessage('Subject is required'),
    body('score').not().isEmpty().withMessage('Score is required'),
    body('comments').not().isEmpty().withMessage('Comments is required'),
    body('examDate').not().isEmpty().withMessage('Exam date is required in the format YYYY-MM-DD')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', message: errors.array() });
    }

    const { subject, score, comments, examDate } = req.body;
    const scorecardId = req.params.id;

    try {
        const scorecard = await Scorecard.findById(scorecardId);
        const student = await Student.findById(scorecard.student);
        if (!scorecard) {
            return res.status(404).json({ status: 'error', message: 'Scorecard not found' });
        }
        if (scorecard.createdBy !== req.user.id) {
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
        res.status(200).json({ status: 'success', message: 'Scorecard updated successfully' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To delete a scorecard for a student
router.delete('/scorecard/:id', fetchTeacher, async (req, res) => {
    const scorecardId = req.params.id;
    try {
        const scorecard = await Scorecard.findById(scorecardId);
        const student = await Student.findById(scorecard.student);
        if (!scorecard) {
            return res.status(404).json({ status: 'error', message: 'Scorecard not found' });
        }
        if (scorecard.createdBy !== req.user.id) {
            return res.status(401).json({ status: 'error', message: 'You are not authorized to delete this scorecard' });
        }
        student.totalScore -= scorecard.score;
        student.scorecards = student.scorecards.filter(sc => sc.id !== scorecardId);
        await student.save();
        await scorecard.remove();
        res.status(200).json({ status: 'success', message: 'Scorecard deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To fetch rankings of students based on the average score
router.get('/rankings', fetchTeacher, async (req, res) => {
    try {
        const students = await Student.find({});
        const studentsWithScorecards = students.filter(student => student.scorecards.length > 0);
        const studentsWithoutScorecards = students.filter(student => student.scorecards.length === 0);
        const rankings = studentsWithScorecards.sort((a, b) => b.totalScore / b.scorecards.length - a.totalScore / a.scorecards.length);
        rankings.push(...studentsWithoutScorecards);
        res.status(200).json({ status: 'success', rankings });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// To fetch all scorecards
router.get('/fetchScorecards', fetchTeacher, async (req, res) => {
    try {
        const scorecards = await Scorecard.find({});
        res.status(200).json({ status: 'success', scorecards });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;