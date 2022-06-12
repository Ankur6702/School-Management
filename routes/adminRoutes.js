const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Student = require('../models/Student');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { fetchAdmin } = require('../middleware/fetchUser');


function validatePassword(data) {
    var password = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,15}$/;
    if (password.test(data)) {
        return true;
    }
    else {
        return false;
    }
}


// To update an existing class
router.put('/updateClass/:id', fetchAdmin, async (req, res) => {
    try {
        const name = req.body.name;
        const classToUpdate = await Class.findById(req.params.id);
        if (!classToUpdate) {
            return res.status(404).json({ status: 'error', message: 'Class not found' });
        }
        classToUpdate.name = name;
        await classToUpdate.save();
        res.status(200).json({ status: 'success', message: 'Class updated successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To fetch a particular teacher
router.get('/fetchTeacher/:id', fetchAdmin, async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ status: 'error', message: 'Teacher not found' });
        }
        res.status(200).json({ status: 'success', teacher });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To fetch a particular class
router.get('/fetchClass/:id', fetchAdmin, async (req, res) => {
    try {
        const classs = await Class.findById(req.params.id);
        if (!classs) {
            return res.status(404).json({ status: 'error', message: 'Class not found' });
        }
        res.status(200).json({ status: 'success', classs });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To fetch a particular student
router.get('/fetchStudent/:id', fetchAdmin, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ status: 'error', message: 'Student not found' });
        }
        res.status(200).json({ status: 'success', student });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To add a new teacher 
router.post('/teacher', fetchAdmin, [
    body('name', 'Name is required').not().isEmpty(),
    body('email').isEmail(),
    body('password', 'Password is required').not().isEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    if(validatePassword(req.body.password) === false) {
        return res.status(400).json({ status: 'error', message: "Password should be of 8 characters long and should be less than 16 characters. It should contain at least one uppercase, one lowercase, and one number" });
    }
    const student = await Student.findOne({ email: req.body.email });
    if (student) {
        return res.status(400).json({ status: 'error', message: 'Student already exists with this email' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    try {
        const teacher = await Teacher.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            registeredBy: req.user.id
        });
        res.status(200).json({ status: 'success', message: 'Teacher created', id: teacher._id });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To delete a teacher
router.delete('/teacher/:id', fetchAdmin, async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ status: 'error', message: 'Teacher not found' });
        }
        const classes = await Class.find({ teacher: teacher._id });

        // remove this teacher from all classes
        classes.forEach(async (classs) => {
            classs.teachers.pull(req.params.id);
            await classs.save();
        });

        await teacher.remove();
        res.status(200).json({ status: 'success', id: req.params.id, message: 'Teacher deleted Successfully.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To add a class
router.post('/class', fetchAdmin, [
    body('name', 'Name is required').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const cls = await Class.create({
            name: req.body.name,
            registeredBy: req.user._id
        });
        res.status(200).json({ status: 'success', message: 'Class created', id: cls._id });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To delete a class
router.delete('/class/:id', fetchAdmin, async (req, res) => {
    try {
        const cls = await Class.findById(req.params.id);
        if (!cls) {
            return res.status(404).json({ status: 'error', message: 'Class not found' });
        }
        const students = await Student.find({ class: cls._id });
        if (students.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Class has students. Cannot delete' });
        }
        await cls.remove();
        res.status(200).json({ status: 'success', id: req.params.id, message: 'Class deleted Successfully.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To add a student
router.post('/student', fetchAdmin, [
    body('name', 'Name is required').not().isEmpty(),
    body('email').isEmail(),
    body('password', 'Password is required').not().isEmpty(),
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    if(validatePassword(req.body.password) === false) {
        return res.status(400).json({ status: 'error', message: "Password should be of 8 characters long and should be less than 16 characters. It should contain at least one uppercase, one lowercase, and one number" });
    }
    const teacher = await Teacher.findOne({ email: req.body.email });
    if (teacher) {
        return res.status(400).json({ status: 'error', message: 'Teacher already exists with this email' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    try {
        const student = await Student.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            registeredBy: req.user.id
        });
        res.status(200).json({ status: 'success', message: 'Student created', id: student._id });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To delete a student
router.delete('/student/:id', fetchAdmin, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ status: 'error', message: 'Student not found' });
        }
        const classs = await Class.findOne({ students: req.params.id });
        classs.students.pull(req.params.id);
        await classs.save();
        await student.remove();
        res.status(200).json({ status: 'success', id: req.params.id, message: 'Student deleted Successfully.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// Maps a class to a teacher
router.post('/teacher/:id/class/:classId', fetchAdmin, async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ status: 'error', message: 'Teacher not found' });
        }
        const cls = await Class.findById(req.params.classId);
        if (!cls) {
            return res.status(404).json({ status: 'error', message: 'Class not found' });
        }
        if (teacher.classes.includes(cls._id)) {
            return res.status(400).json({ status: 'error', message: 'Class already assigned to teacher' });
        }
        if (cls.teachers.includes(teacher._id)) {
            return res.status(400).json({ status: 'error', message: 'Teacher already assigned to class' });
        }
        teacher.classes.push(cls._id);
        cls.teachers.push(teacher._id);
        await teacher.save();
        await cls.save();
        res.status(200).json({ status: 'success', message: 'Class added to teacher' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// Maps a student to a class
router.post('/class/:id/student/:studentId', fetchAdmin, async (req, res) => {
    try {
        const cls = await Class.findById(req.params.id);
        if (!cls) {
            return res.status(404).json({ status: 'error', message: 'Class not found' });
        }
        const student = await Student.findById(req.params.studentId);
        if (!student) {
            return res.status(404).json({ status: 'error', message: 'Student not found' });
        }
        if (cls.students.includes(student._id)) {
            return res.status(400).json({ status: 'error', message: 'Student already added to class' });
        }
        if (student.class !== null) {
            return res.status(400).json({ status: 'error', message: 'Student already assigned to another class' });
        }
        cls.students.push(student);
        student.class = cls;
        await cls.save();
        await student.save();
        res.status(200).json({ status: 'success', message: 'Student added to class' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To get all teachers assigned to a particular class
router.get('/class/:id/teachers', fetchAdmin, async (req, res) => {
    try {
        const cls = await Class.findById(req.params.id);
        if (!cls) {
            return res.status(404).json({ status: 'error', message: 'Class not found' });
        }
        const teachers = cls.teachers.map(async (teacherId) => {
            const teacher = await Teacher.findById(teacherId);
            return teacher;
        });
        const teachersList = await Promise.all(teachers);
        res.status(200).json({ status: 'success', teachers: teachersList });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;