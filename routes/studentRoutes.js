const express = require('express');
const router = express.Router();
const Scorecard = require('../models/Scorecard');
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


module.exports = router;
