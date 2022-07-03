// Npm Packages
const express = require('express');
const router = express.Router();

// Models
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Book = require('../models/Book');

// Local functions
const logger = require('../logger');

// ===========================================Controllers=====================================================

// To fetch all teachers
router.get('/fetchTeachers', async (req, res) => {
    logger.info('Fetch teachers request received');
    try {
        const teachers = await Teacher.find({});
        logger.info('Fetch teachers successful');
        logger.debug('Teachers details: ' + teachers);
        res.status(200).json({ status: 'success', teachers });
    } catch (error) {
        logger.error('Fetch teachers failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To fetch all the classes
router.get('/fetchClasses', async (req, res) => {
    logger.info('Fetch classes request received');
    try {
        const classes = await Class.find({});
        logger.info('Fetch classes successful');
        logger.debug('Classes details: ' + classes);
        res.status(200).json({ status: 'success', classes });
    } catch (error) {
        logger.error('Fetch classes failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To fetch all students
router.get('/fetchStudents', async (req, res) => {
    logger.info('Fetch students request received');
    try {
        const students = await Student.find({});
        logger.info('Fetch students successful');
        logger.debug('Students details: ' + students);
        res.status(200).json({ status: 'success', students });
    } catch (error) {
        logger.error('Fetch students failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To fetch all books
router.get('/fetchBooks', async (req, res) => {
    logger.info('Fetch books request received');
    try {
        const books = await Book.find({});
        logger.info('Fetch books successful');
        logger.debug('Books details: ' + books);
        res.status(200).json({ status: 'success', books });
    } catch (error) {
        logger.error('Fetch books failed: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;