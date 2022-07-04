// NPM Packages
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

const logger = require('../logger');

dotenv.config();

let url;
if (process.env.NODE_ENV === 'development') {
    url = 'http://localhost:9999/api';
} else {
    url = 'https://sch-management-server.herokuapp.com/api';
}

function sendResetPasswordMail(email, name, token) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_ID,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const verificationURL = `${url}/auth/reset-password/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_ID,
        to: email,
        subject: 'Forgot Password',
        html: `Hi ${name},<br>
        You have requested for a password reset.<br>
        Please click on the following link to reset your password:\n<a href="${verificationURL}">Click Here</a><br>
        If you did not request a password reset, please ignore this email.<br><br>
        Regards,<br>
        Team Verify`
    };

    logger.info('Sending email');
    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            logger.error('Issues in sending Mail: ', err);
        } else {
            logger.info('Email sent');
        }
    });
}

module.exports = { sendResetPasswordMail };