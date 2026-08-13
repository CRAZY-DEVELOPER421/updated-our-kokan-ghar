const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail } = require('../services/email.service');

const submitContact = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return ApiResponse.error(res, 'Please fill in all required fields.', 400);
  }

  // Send notification email to admin
  const adminHtml = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Message:</strong></p>
    <p>${message}</p>
  `;

  await sendEmail({
    to: process.env.SMTP_FROM || 'hello@kokanghar.in',
    subject: `Contact Form: ${subject}`,
    html: adminHtml,
  });

  return ApiResponse.success(res, {}, 'Your message has been received. We will get back to you within 24 hours.');
});

module.exports = {
  submitContact
};
