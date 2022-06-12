const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Student = require('../models/Student');

// To fetch all teachers
router.get('/fetchTeachers', async (req, res) => {
    try {
        const teachers = await Teacher.find({});
        res.status(200).json({ status: 'success', teachers });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To fetch all the classes
router.get('/fetchClasses', async (req, res) => {
    try {
        const classes = await Class.find({});
        res.status(200).json({ status: 'success', classes });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To fetch all students
router.get('/fetchStudents', async (req, res) => {
    try {
        const students = await Student.find({});
        res.status(200).json({ status: 'success', students });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;