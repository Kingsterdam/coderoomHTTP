const express = require('express');
const transporter = require('../transporter');
const router = express.Router();

router.post('/', async (req, res) => {
    const { email, url } = req.body;
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
                    background-color: #38a169; /* Tailwind's bg-green-500 */
                    color: white;
                    text-align: center;
                    padding: 15px;
                    border-radius: 10px 10px 0 0;
                }

                .button {
                    background-color: #38a169; /* Tailwind's bg-green-500 */
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
                    background-color: #2f855a; /* Tailwind's hover:bg-green-600 */
                }

                .footer {
                    background-color: #f7fafc; /* Tailwind's bg-gray-200 */
                    text-align: center;
                    padding: 10px;
                    border-radius: 0 0 10px 10px;
                }

                .footer p {
                    font-size: 12px;
                    color: #718096; /* Tailwind's text-gray-600 */
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
                    <a href="${url}" class="button">Join CodeRoom</a>
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
        await transporter.sendMail(mailOptions);
        res.status(200).send({ message: 'Invite sent successfully' });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

module.exports = router;
