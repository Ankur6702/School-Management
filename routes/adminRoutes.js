// Npm Packages
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');

// Models
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Student = require('../models/Student');

// Local functions
const logger = require('../logger');
const { fetchAdmin } = require('../middleware/fetchUser');

dotenv.config();

// ===========================================Controllers=====================================================

// To update an existing class
router.put('/updateClass/:id', fetchAdmin, [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('capacity').not().isEmpty().withMessage('Capacity is required'),
], async (req, res) => {
    logger.info('Updating class');
    try {
        const name = req.body.name;
        const capacity = req.body.capacity;
        const classToUpdate = await Class.findById(req.params.id);
        logger.debug('Class before updation: ', classToUpdate);
        if (!classToUpdate) {
            logger.error('Class not found');
            return res.status(404).json({ status: 'error', message: 'Class not found' });
        }
        classToUpdate.name = name;
        classToUpdate.capacity = capacity;
        await classToUpdate.save();
        logger.info('Class updated successfully');
        logger.debug('Class details: ' + classToUpdate);
        res.status(200).json({ status: 'success', message: 'Class updated successfully' });
    } catch (error) {
        logger.error('Error: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To fetch a particular teacher
router.get('/fetchTeacher/:id', fetchAdmin, async (req, res) => {
    logger.info('Fetching teacher');
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            logger.error('Teacher not found');
            return res.status(404).json({ status: 'error', message: 'Teacher not found' });
        }
        logger.info('Teacher fetched successfully');
        logger.debug('Teacher details: ' + teacher);
        res.status(200).json({ status: 'success', teacher });
    } catch (error) {
        logger.error("Error: ", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To fetch a particular class
router.get('/fetchClass/:id', fetchAdmin, async (req, res) => {
    logger.info('Fetching class');
    try {
        const classs = await Class.findById(req.params.id);
        if (!classs) {
            logger.error('Class not found');
            return res.status(404).json({ status: 'error', message: 'Class not found' });
        }
        logger.info('Class fetched successfully');
        logger.debug('Class details: ' + classs);
        res.status(200).json({ status: 'success', classs });
    } catch (error) {
        logger.error("Error: ", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To fetch a particular student
router.get('/fetchStudent/:id', fetchAdmin, async (req, res) => {
    logger.info('Fetching student');
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            logger.error('Student not found');
            return res.status(404).json({ status: 'error', message: 'Student not found' });
        }
        logger.info('Student fetched successfully');
        logger.debug('Student details: ' + student);
        res.status(200).json({ status: 'success', student });
    } catch (error) {
        logger.error("Error: ", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To add a new teacher 
router.post('/teacher', fetchAdmin, [
    body('name', 'Name is required').not().isEmpty(),
    body('email').isEmail(),
    body('password', 'Password is required').not().isEmpty(),
    // body('isLibrarian').isBoolean(),
    // body('isAdmin').isBoolean(),
], async (req, res) => {
    logger.info('Adding a new teacher');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Validation failed');
        return res.status(400).json({ errors: errors.array() });
    }
    if (validatePassword(req.body.password) === false) {
        return res.status(400).json({ status: 'error', message: "Password should be of 8 characters long and should be less than 16 characters. It should contain at least one uppercase, one lowercase, and one number" });
    }
    const student = await Student.findOne({ email: req.body.email });
    if (student) {
        logger.error('Student already exists');
        logger.debug('Student details: ' + student);
        return res.status(400).json({ status: 'error', message: 'Student already exists with this email' });
    }
    const salt = bcrypt.genSalt(process.env.SALT_ROUNDS);
    const hashedPassword = bcrypt.hash(req.body.password, salt);
    try {
        const teacher = await Teacher.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            isLibrarian: (req.body.isLibrarian === 'true') ? true : false,
            isTeacher: (req.body.isTeacher === 'true') ? true : false,
            isAdmin: (req.body.isAdmin === 'true') ? true : false,
            registeredBy: req.user.id
        });
        logger.info('Teacher added successfully');
        logger.debug('Teacher details: ' + teacher);
        res.status(200).json({ status: 'success', message: 'Teacher created', id: teacher._id });
    } catch (error) {
        logger.error('Error: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To delete a teacher
router.delete('/teacher/:id', fetchAdmin, async (req, res) => {
    logger.info('Deleting a teacher');
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            logger.error('Teacher not found');
            return res.status(404).json({ status: 'error', message: 'Teacher not found' });
        }
        const classes = await Class.find({ teacher: teacher._id });

        // remove this teacher from all classes
        classes.forEach(async (classs) => {
            classs.teachers.pull(req.params.id);
            await classs.save();
        });
        logger.info('Teacher removed from all the asssigned classes');

        await teacher.remove();
        logger.info('Teacher deleted successfully');
        logger.debug('Teacher details: ' + teacher);
        res.status(200).json({ status: 'success', id: req.params.id, message: 'Teacher deleted Successfully.' });
    } catch (error) {
        logger.error('Error: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To add a class
router.post('/class', fetchAdmin, [
    body('name', 'Name is required').not().isEmpty(),
    body('capacity', 'Class capacity is required').not().isEmpty(),
], async (req, res) => {
    logger.info('Adding a new class');
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        logger.error('Validation failed');
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const classs = await Class.findOne({ name: req.body.name });
        if (classs) {
            logger.error('Class already exists');
            logger.debug('Class details: ' + classs);
            return res.status(400).json({ status: 'error', message: 'Class already exists with this name' });
        }

        const cls = await Class.create({
            name: req.body.name,
            capacity: req.body.capacity,
            registeredBy: req.user._id
        });
        logger.info('Class added successfully');
        logger.debug('Class details: ' + cls);
        res.status(200).json({ status: 'success', message: 'Class created', id: cls._id });
    } catch (error) {
        logger.error('Error: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To delete a class
router.delete('/class/:id', fetchAdmin, async (req, res) => {
    logger.info('Deleting a class');
    try {
        const cls = await Class.findById(req.params.id);
        if (!cls) {
            logger.error('Class not found');
            return res.status(404).json({ status: 'error', message: 'Class not found' });
        }
        const students = await Student.find({ class: cls._id });
        if (students.length > 0) {
            logger.error('Class has students, cannot be deleted');
            return res.status(400).json({ status: 'error', message: 'Class has students. Cannot delete' });
        }
        await cls.remove();
        logger.info('Class deleted successfully');
        logger.debug('Class details: ' + cls);
        res.status(200).json({ status: 'success', id: req.params.id, message: 'Class deleted Successfully.' });
    } catch (error) {
        logger.error('Error: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To add a student
router.post('/student', fetchAdmin, [
    body('name', 'Name is required').not().isEmpty(),
    body('email').isEmail(),
    body('password', 'Password is required').not().isEmpty(),
    body('isAdmin').isBoolean(),
], async (req, res) => {
    logger.info('Adding a new student');

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        logger.error('Validation failed');
        return res.status(400).json({ errors: errors.array() });
    }
    if (validatePassword(req.body.password) === false) {
        return res.status(400).json({ status: 'error', message: "Password should be of 8 characters long and should be less than 16 characters. It should contain at least one uppercase, one lowercase, and one number" });
    }
    const teacher = await Teacher.findOne({ email: req.body.email });
    if (teacher) {
        logger.error('Teacher already exists');
        return res.status(400).json({ status: 'error', message: 'Teacher already exists with this email' });
    }
    const salt = bcrypt.genSalt(process.env.SALT_ROUNDS);
    const hashedPassword = bcrypt.hash(req.body.password, salt);
    try {
        const student = await Student.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            isAdmin: (req.body.isAdmin === 'true') ? true : false,
            registeredBy: req.user.id
        });
        logger.info('Student added successfully');
        logger.debug('Student details: ' + student);
        res.status(200).json({ status: 'success', message: 'Student created', id: student._id });
    } catch (error) {
        logger.error('Error: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To delete a student
router.delete('/student/:id', fetchAdmin, async (req, res) => {
    logger.info('Deleting a student');
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            logger.error('Student not found');
            return res.status(404).json({ status: 'error', message: 'Student not found' });
        }
        const classs = await Class.findOne({ students: req.params.id });
        classs.students.pull(req.params.id);
        logger.info('Student removed from the class');
        await classs.save();
        await student.remove();
        logger.info('Student deleted successfully');
        logger.debug('Student details: ' + student);
        res.status(200).json({ status: 'success', id: req.params.id, message: 'Student deleted Successfully.' });
    } catch (error) {
        logger.error('Error: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// Maps a class to a teacher
router.post('/teacher/:id/class/:classId', fetchAdmin, async (req, res) => {
    logger.info('Mapping a class to a teacher');
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            logger.error('Teacher not found');
            return res.status(404).json({ status: 'error', message: 'Teacher not found' });
        }
        const cls = await Class.findById(req.params.classId);
        if (!cls) {
            logger.error('Class not found');
            return res.status(404).json({ status: 'error', message: 'Class not found' });
        }
        if (teacher.classes.includes(cls._id)) {
            logger.error('Class already mapped to this teacher');
            return res.status(400).json({ status: 'error', message: 'Class already assigned to teacher' });
        }
        teacher.classes.push(cls._id);
        cls.teachers.push(teacher._id);
        await teacher.save();
        await cls.save();
        logger.info('Class mapped to teacher successfully');
        logger.debug('Class details: ' + cls);
        res.status(200).json({ status: 'success', message: 'Class added to teacher' });
    } catch (error) {
        logger.error('Error: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// Maps a student to a class
router.post('/class/:id/student/:studentId', fetchAdmin, async (req, res) => {
    logger.info('Mapping a student to a class');
    try {
        const cls = await Class.findById(req.params.id);
        if (!cls) {
            logger.error('Class not found');
            return res.status(404).json({ status: 'error', message: 'Class not found' });
        }
        const student = await Student.findById(req.params.studentId);
        if (!student) {
            logger.error('Student not found');
            return res.status(404).json({ status: 'error', message: 'Student not found' });
        }
        if (cls.students.includes(student._id)) {
            logger.error('Student already mapped to this class');
            return res.status(400).json({ status: 'error', message: 'Student already added to class' });
        }
        if (student.class !== null) {
            logger.error('Student already assigned to a class');
            return res.status(400).json({ status: 'error', message: 'Student already assigned to another class' });
        }
        if (cls.capacity === cls.students.length) {
            logger.error('Class is full');
            return res.status(400).json({ status: 'error', message: 'Class is full' });
        }
        cls.students.push(student);
        student.class = cls;
        await cls.save();
        await student.save();
        logger.info('Student mapped to class successfully');
        logger.debug('Student details: ' + student);
        res.status(200).json({ status: 'success', message: 'Student added to class' });
    } catch (error) {
        logger.error('Error: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To get all teachers assigned to a particular class
router.get('/class/:id/teachers', fetchAdmin, async (req, res) => {
    logger.info('Getting all teachers assigned to a class');
    try {
        const cls = await Class.findById(req.params.id);
        if (!cls) {
            logger.error('Class not found');
            return res.status(404).json({ status: 'error', message: 'Class not found' });
        }
        const teachers = cls.teachers.map(async (teacherId) => {
            const teacher = await Teacher.findById(teacherId);
            return teacher;
        });
        const teachersList = await Promise.all(teachers);
        logger.info('Teachers found successfully');
        logger.debug('Teachers: ' + teachersList);
        res.status(200).json({ status: 'success', teachers: teachersList });
    } catch (error) {
        logger.error('Error: ', error);
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

module.exports = router;