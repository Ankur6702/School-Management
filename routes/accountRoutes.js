// Npm Packages
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Models
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// Local functions
const logger = require('../logger');

// ===========================================Controllers=====================================================

// ============================================================================================================

module.exports = router