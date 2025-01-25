const express = require('express');
const transporter = require('../transporter');
const router = express.Router();
const redisClient = require('../redisClient');


router.post('/', async (req, res) => {
    const { email, url, room } = req.body;

    // Check if all required fields are present
    if (!email || !url || !room) {
        return res.status(400).json({
            error: 'Missing required fields',
            details: {
                email: !email ? 'Email is required' : null,
                url: !url ? 'URL is required' : null,
                room: !room ? 'Room is required' : null
            }
        });
    }

    // Get token from Redis
    const token = await redisClient.get(`room:${room}`);
    if (!token) {
        return res.status(404).json({
            error: 'Room not found or expired'
        });
    }

    const token_url = url + `?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'You Are Invited!',
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation Email</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                }

                .header {
                    background-color: #38a169;
                    color: white;
                    text-align: center;
                    padding: 15px;
                    border-radius: 10px 10px 0 0;
                }

                .button {
                    background-color: #38a169;
                    color: white;
                    font-size: 18px;
                    font-weight: bold;
                    padding: 15px 30px;
                    border-radius: 5px;
                    text-decoration: none;
                    display: inline-block;
                    margin-top: 20px;
                    text-align: center;
                }

                .button:hover {
                    background-color: #2f855a;
                }

                .footer {
                    background-color: #f7fafc;
                    text-align: center;
                    padding: 10px;
                    border-radius: 0 0 10px 10px;
                }

                .footer p {
                    font-size: 12px;
                    color: #718096;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to CodeRoom!</h1>
                </div>
                <div class="body">
                    <p>Hello,</p>
                    <p>You've been invited to join <strong>CodeRoom</strong>!</p>
                    <p>Click the button below to accept the invitation and start your journey with us:</p>
                    <a href="${token_url}" class="button">Join CodeRoom</a>
                </div>
                <div class="footer">
                    <p>&copy; 2024 CodeRoom. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `,
    };

    try {
        // Attempt to send the email
        const info = await transporter.sendMail(mailOptions);
        
        // Check if the email was actually sent
        if (!info || !info.messageId) {
            throw new Error('Failed to send email');
        }

        res.status(200).json({
            message: 'Invite sent successfully',
            messageId: info.messageId
        });
    } catch (err) {
        // Handle specific nodemailer errors
        if (err.code === 'EENVELOPE' || err.code === 'ECONNECTION') {
            return res.status(400).json({
                error: 'Invalid email or email delivery failed',
                details: err.message
            });
        }

        // Handle other errors
        res.status(500).json({
            error: 'Failed to send invite',
            details: err.message
        });
    }
});

module.exports = router;