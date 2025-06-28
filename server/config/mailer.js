import dotenv from 'dotenv';
dotenv.config();  // ✅ load env specific to mailer.js

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

console.log("🚀 Transporter created with:", {
  user: process.env.EMAIL_USER,
  passSet: !!process.env.EMAIL_PASS
});

export default transporter;
