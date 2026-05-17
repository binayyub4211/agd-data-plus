const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

async function test() {
  console.log('--- Email Connection Test ---');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('User:', process.env.SMTP_USER);
  console.log('Port:', process.env.SMTP_PORT);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
  });

  try {
    console.log('Connecting to Brevo...');
    await transporter.verify();
    console.log('✅ Connection Successful!');

    console.log('Sending Test Email...');
    const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    await transporter.sendMail({
      from: `"AGD Data Plus" <${senderEmail}>`,
      to: 'mmuktar1142@gmail.com',
      subject: 'AGD Data Plus - Test Success! 🚀',
      html: '<h1>It Works!</h1><p>Your email system is now live and professional.</p>',
    });
    console.log('✅ Email Sent Successfully! Check your inbox.');
  } catch (error) {
    console.error('❌ Test Failed!');
    console.error(error);
  }
}

test();
