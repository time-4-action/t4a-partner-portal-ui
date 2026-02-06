/**
 * Contact Form API Route
 *
 * Handles contact form submissions by sending emails via nodemailer with Gmail SMTP.
 *
 * Required Environment Variables:
 * - GMAIL_EMAIL: Gmail address to send emails from
 * - GMAIL_APP_PASSWORD: Gmail App Password (not regular password)
 *
 * Security Note:
 * GMAIL_APP_PASSWORD must be an App Password generated from Google Account settings,
 * not the regular Gmail password. Enable 2FA first, then generate an app password at:
 * https://myaccount.google.com/apppasswords
 *
 * @module ContactRoute
 */

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * Sends an email using nodemailer with Gmail SMTP.
 *
 * Configures a Gmail transporter and sends a formatted email with both
 * plain text and HTML versions. The email is sent to a fixed recipient
 * (grega@etiam.si) with the form submitter's email as the reply-to address.
 *
 * @async
 * @param {Object} params - Email parameters
 * @param {string} params.name - Sender's name
 * @param {string} params.company - Sender's company
 * @param {string} params.email - Sender's email address (used for reply-to)
 * @param {string} params.message - Message content
 * @returns {Promise<void>}
 * @throws {Error} If email sending fails due to auth or network issues
 *
 * @example
 * await sendEmail({
 *   name: "John Doe",
 *   company: "ACME Corp",
 *   email: "john@acme.com",
 *   message: "I'm interested in your products"
 * });
 */
async function sendEmail({ name, company, email, message }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD, // IMPORTANT: Use an App Password, not regular password
    },
  });

  const mailOptions = {
    from: `"Patrik Partner Portal" <${process.env.GMAIL_EMAIL}>`,
    to: 'grega@etiam.si',
    replyTo: email,
    subject: 'New Contact Form Submission from Patrik Products Portal',
    text: `You have a new submission from the contact form.

Name: ${name}
Company: ${company}
Email: ${email}

Message:
${message}`,
    html: `<p>You have a new submission from the contact form.</p>
           <ul>
             <li><strong>Name:</strong> ${name}</li>
             <li><strong>Company:</strong> ${company}</li>
             <li><strong>Email:</strong> ${email}</li>
           </ul>
           <p><strong>Message:</strong></p>
           <p>${message.replace(/\n/g, '<br>')}</p>`,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * POST handler for contact form submissions.
 *
 * Receives JSON body with contact form data, sends email, and returns success/error response.
 *
 * @async
 * @param {Request} request - Next.js request object with JSON body
 * @returns {Promise<NextResponse>} JSON response with success or error message
 *
 * @example
 * // Request body:
 * {
 *   "name": "John Doe",
 *   "company": "ACME Corp",
 *   "email": "john@acme.com",
 *   "message": "I'm interested in your products"
 * }
 *
 * // Success response:
 * { "message": "Email sent successfully" }
 *
 * // Error response (500):
 * { "error": "Failed to send email" }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    await sendEmail(body);
    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
