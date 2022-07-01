const express = require('express');
const router = express.Router();
const { fetchLibrarian } = require('../middleware/fetchUser');
const Book = require('../models/Book');
const Student = require('../models/Student');
const { body, validationResult } = require('express-validator');


// To add a new book
router.post('/addBook', fetchLibrarian, [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('author').not().isEmpty().withMessage('Author is required'),
    body('quantity').not().isEmpty().withMessage('Quantity is required'),
    body('price').not().isEmpty().withMessage('Price is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, author, quantity, price } = req.body;
    // check if book already exists
    const book = await Book.findOne({ title, author });
    if (book) {
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
        res.status(201).json({ message: 'Book added successfully', book: newBook });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update book details
router.put('/updateBook/:id', fetchLibrarian, async (req, res) => {
    const { id } = req.params;
    try {
        const book = await Book.findById(id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        book.title = (req.body.title) ? req.body.title : book.title;
        book.author = (req.body.author) ? req.body.author : book.author;
        book.quantity = (req.body.quantity) ? req.body.quantity : book.quantity;
        book.price = (req.body.price) ? req.body.price : book.price;
        await book.save();
        res.status(200).json({ message: 'Book updated successfully', book });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete book
router.delete('/deleteBook/:id', fetchLibrarian, async (req, res) => {
    const { id } = req.params;
    try {
        const book = await Book.findById(id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // check if book is issued
        if (book.details.length > 0) {
            return res.status(400).json({ error: "Book is issued by someone, can't be deleted" });
        }

        await Book.findByIdAndDelete(id);
        res.status(200).json({ message: 'Book deleted successfully', book });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// To issue a book
router.post('/issueBook/:id/student/:studentId', fetchLibrarian, async (req, res) => {
    const { id, studentId } = req.params;
    let issueDate = new Date();
    let returnDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    try {
        const book = await Book.findById(id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        if (book.quantity === 0) {
            return res.status(400).json({ error: 'Book is out of stock' });
        }
        
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // check if book is already issued by the student
        if (book.details.find(detail => detail.issuedBy.toString() === studentId)) {
            return res.status(400).json({ error: 'Book is already issued to this student' });
        }

        // check if student has already issued 3 books
        if (student.issuedBooks.length === 3) {
            return res.status(400).json({ error: 'Student has already issued 3 books' });
        }
        
        // add book to student's issuedBooks array
        student.issuedBooks.push(id);

        // add student to book's issuedBy array
        book.details.push({ issuedBy: studentId, issueDate, returnDate });
        book.quantity--;

        await student.save();
        await book.save();
        res.status(200).json({ message: 'Book issued successfully', book });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// To return a book
router.post('/returnBook/:id/student/:studentId', fetchLibrarian, async (req, res) => {
    const { id, studentId } = req.params;
    try {
        const book = await Book.findById(id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // check if book is issued by the student
        if (!book.details.find(detail => detail.issuedBy.toString() === studentId)) {
            return res.status(400).json({ error: 'Book is not issued to this student' });
        }

        // check if returned late and add penalty to student
        const detail = book.details.find(detail => detail.issuedBy.toString() === studentId);
        if (new Date() > detail.returnDate) {
            student.libraryPenalty += parseInt((new Date() - detail.returnDate) / (1000 * 60 * 60 * 24));
        }

        // remove book from student's issuedBooks array
        student.issuedBooks.splice(student.issuedBooks.indexOf(id), 1);

        // remove student from book's issuedBy array
        book.details.splice(book.details.indexOf(detail), 1);
        book.quantity++;

        await student.save();
        await book.save();
        res.status(200).json({ message: 'Book returned successfully', book, studentPenalty: student.libraryPenalty });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// To get all students who haven't returned the book after 30 days
router.get('/getLateStudents', fetchLibrarian, async (req, res) => {
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
        res.status(200).json({ message: "Students who haven't returned book on time" , lateStudents });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router