const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
    try {
        const oauth2Client = new OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            "https://developers.google.com/oauthplayground/"
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.REFRESH_TOKEN
        });

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.USER_EMAIL,
                accessToken: process.env.ACCESS_TOKEN,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN
            },
        });
        return transporter;
    } catch (err) {
        return err
    }
};

const sendEmail = async options => { // set the user's argu in to the options parameter
    // 2) Define the email options
    const mailOptions = {
        from: 'Bhavesh kumar <bhavesh.anskey@gmail.com>',
        to: options.email,
        subject: options.subject,
        // text: options.message
        html: options.html
    }
    // 3) Actually send the email
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(mailOptions);
}

module.exports = sendEmail;