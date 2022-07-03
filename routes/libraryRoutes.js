// Npm Packages
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Models
const Book = require('../models/Book');
const Student = require('../models/Student');

// Local functions
const { fetchLibrarian } = require('../middleware/fetchUser');
const logger = require('../logger');

// ===========================================Controllers=====================================================

// To add a new book
router.post('/addBook', fetchLibrarian, [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('author').not().isEmpty().withMessage('Author is required'),
    body('quantity').not().isEmpty().withMessage('Quantity is required'),
    body('price').not().isEmpty().withMessage('Price is required')
], async (req, res) => {
    logger.info('Add book request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Add book failed: ', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, author, quantity, price } = req.body;
    const book = await Book.findOne({ title, author });
    if (book) {
        logger.error('Add book failed: Book already exists');
        return res.status(400).json({ error: 'Book already exists' });
    }

    try {
        const newBook = new Book({
            title,
            author,
            quantity,
            price
        });
        await newBook.save();
        logger.info('Book added successfully');
        logger.debug('Book details: ' + newBook);
        res.status(201).json({ message: 'Book added successfully', book: newBook });
    } catch (err) {
        logger.error('Add book failed: ', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================================================================

// Update book details
router.put('/updateBook/:id', fetchLibrarian, async (req, res) => {
    logger.info('Update book request received');
    const { id } = req.params;
    
    try {
        const book = await Book.findById(id);
        if (!book) {
            logger.error('Update book failed: Book not found');
            return res.status(404).json({ error: 'Book not found' });
        }
        
        book.title = (req.body.title) ? req.body.title : book.title;
        book.author = (req.body.author) ? req.body.author : book.author;
        book.quantity = (req.body.quantity) ? req.body.quantity : book.quantity;
        book.price = (req.body.price) ? req.body.price : book.price;
        
        await book.save();
        logger.info('Book updated successfully');
        logger.debug('Book details: ' + book);
        res.status(200).json({ message: 'Book updated successfully', book });
    } catch (err) {
        logger.error('Update book failed: ', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================================================================

// Delete book
router.delete('/deleteBook/:id', fetchLibrarian, async (req, res) => {
    logger.info('Delete book request received');
    const { id } = req.params;
    
    try {
        const book = await Book.findById(id);
        if (!book) {
            logger.error('Delete book failed: Book not found');
            return res.status(404).json({ error: 'Book not found' });
        }

        // check if book is issued
        if (book.details.length > 0) {
            logger.error('Delete book failed: Book is already issued by someone');
            return res.status(400).json({ error: "Book is issued by someone, can't be deleted" });
        }

        await Book.findByIdAndDelete(id);
        logger.info('Book deleted successfully');
        logger.debug('Book details: ' + book);
        res.status(200).json({ message: 'Book deleted successfully', book });
    } catch (err) {
        logger.error('Delete book failed: ', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================================================================

// To issue a book
router.post('/issueBook/:id/student/:studentId', fetchLibrarian, async (req, res) => {
    logger.info('Issue book request received');
    const { id, studentId } = req.params;
    logger.debug('Book id: ' + id + ' Student id: ' + studentId);
    let issueDate = new Date();
    let returnDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    try {
        const book = await Book.findById(id);
        if (!book) {
            logger.error('Issue book failed: Book not found');
            return res.status(404).json({ error: 'Book not found' });
        }
        
        if (book.quantity === 0) {
            logger.error('Issue book failed: Book is out of stock');
            return res.status(400).json({ error: 'Book is out of stock' });
        }
        
        const student = await Student.findById(studentId);
        if (!student) {
            logger.error('Issue book failed: Student not found');
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // check if book is already issued by the student
        if (book.details.find(detail => detail.issuedBy.toString() === studentId)) {
            logger.error('Issue book failed: Book is already issued by the student');
            return res.status(400).json({ error: 'Book is already issued to this student' });
        }

        // check if student has already issued 3 books
        if (student.issuedBooks.length === 3) {
            logger.error('Issue book failed: Student has already issued 3 books');
            return res.status(400).json({ error: 'Student has already issued 3 books' });
        }
        
        // add book to student's issuedBooks array
        student.issuedBooks.push(id);

        // add student to book's issuedBy array
        book.details.push({ issuedBy: studentId, issueDate, returnDate });
        book.quantity--;

        await student.save();
        await book.save();
        logger.info('Book issued successfully');
        logger.debug('Book details: ' + book);
        res.status(200).json({ message: 'Book issued successfully', book });
    } catch (err) {
        logger.error('Issue book failed: ', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================================================================

// To return a book
router.post('/returnBook/:id/student/:studentId', fetchLibrarian, async (req, res) => {
    logger.info('Return book request received');
    const { id, studentId } = req.params;
    try {
        const book = await Book.findById(id);
        if (!book) {
            logger.error('Return book failed: Book not found');
            return res.status(404).json({ error: 'Book not found' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            logger.error('Return book failed: Student not found');
            return res.status(404).json({ error: 'Student not found' });
        }

        // check if book is issued by the student
        if (!book.details.find(detail => detail.issuedBy.toString() === studentId)) {
            logger.error('Return book failed: Book is not issued by the student');
            return res.status(400).json({ error: 'Book is not issued to this student' });
        }

        // check if returned late and add penalty to student
        const detail = book.details.find(detail => detail.issuedBy.toString() === studentId);
        if (new Date() > detail.returnDate) {
            logger.info('Book is returned late');
            student.libraryPenalty += parseInt((new Date() - detail.returnDate) / (1000 * 60 * 60 * 24));
            logger.debug('Penalty added to student: ' + student.libraryPenalty);
        }

        // remove book from student's issuedBooks array
        student.issuedBooks.splice(student.issuedBooks.indexOf(id), 1);

        // remove student from book's issuedBy array
        book.details.splice(book.details.indexOf(detail), 1);
        book.quantity++;

        await student.save();
        await book.save();
        logger.info('Book returned successfully');
        logger.debug('Book details: ' + book);
        res.status(200).json({ message: 'Book returned successfully', book, studentPenalty: student.libraryPenalty });
    } catch (err) {
        logger.error('Return book failed: ', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================================================================

// To get all students who haven't returned the book after 30 days
router.get('/getLateStudents', fetchLibrarian, async (req, res) => {
    logger.info('Get late students request received');
    try {
        let lateStudents = [{}];
        const books = await Book.find({});
        
        for (let book of books) {
            for (let detail of book.details) {
                if (new Date() > detail.returnDate) {
                    const student = await Student.findById(detail.issuedBy);
                    const bookId = book._id;
                    lateStudents.push({ name: student.name, email: student.email, bookId });
                }
            }
        }
        logger.info('Late students fetched successfully');
        logger.debug('Late students: ' + lateStudents);
        res.status(200).json({ message: "Students who haven't returned book on time" , lateStudents });
    } catch (err) {
        logger.error('Get late students failed: ', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router