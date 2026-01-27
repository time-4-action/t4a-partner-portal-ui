import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// This is a placeholder for a real email sending service.
// You would replace this with a library like nodemailer, Resend, or SendGrid.
async function sendEmail({ name, company, email, message }) {
  // In a real application, you would have your email sending logic here.
  // For example, using nodemailer with Gmail:
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD, // IMPORTANT: Use an App Password here
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
