const occasions = new Set([
  'Corporate gifting', 'Baby shower', 'Birthday', 'Christmas',
  'Thanksgiving', 'Diwali', 'Housewarming', 'Something else'
]);
const emailPattern = /^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/;
const response = (status, message) => ({
  status,
  headers: { 'Cache-Control': 'no-store' },
  jsonBody: { message }
});

function createEnquiryHandler({ sendMail, env = process.env }) {
  return async (request, context) => {
    const origins = (env.CONTACT_ALLOWED_ORIGINS ||
      'https://velvetribbons.ca,https://www.velvetribbons.ca,https://polite-bay-02cdf1710.7.azurestaticapps.net')
      .split(',').map(value => value.trim());
    const origin = request.headers.get('origin');
    if (origin && !origins.includes(origin)) {
      return response(403, 'Please submit your enquiry through our website.');
    }
    if (!(request.headers.get('content-type') || '').startsWith('application/json')) {
      return response(415, 'Please submit your enquiry through our website.');
    }
    let data;
    try {
      const body = await request.text();
      if (Buffer.byteLength(body, 'utf8') > 12000) {
        return response(413, 'Your enquiry is too long. Please shorten the details.');
      }
      data = JSON.parse(body);
    } catch {
      return response(400, 'Please check your enquiry and try again.');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return response(400, 'Please check your enquiry and try again.');
    }
    // A field hidden from visitors catches basic automated form submissions.
    if (data.website) return response(200, 'Thank you for your enquiry.');
    const { name, email, occasion, details } = data;
    if (typeof name !== 'string' || !name.trim() || name.length > 100 || /[\r\n]/.test(name) ||
        typeof email !== 'string' || email.length > 254 || !emailPattern.test(email.trim()) ||
        !occasions.has(occasion) || typeof details !== 'string' ||
        !details.trim() || details.length > 4000) {
      return response(400, 'Please enter your name, a valid email address and enquiry details.');
    }
    const to = env.CONTACT_TO;
    const from = env.SMTP_USER;
    if (!to || !from || !env.SMTP_PASSWORD || !emailPattern.test(to) || !emailPattern.test(from)) {
      context.error('Contact email delivery is not configured.');
      return response(503, 'We could not send your enquiry right now. Please try again later or contact us on Instagram.');
    }
    try {
      // Recipient and sender are server settings; visitor input cannot override them.
      const result = await sendMail({
        from: { name: 'Velvet Ribbons website', address: from },
        to,
        replyTo: email.trim(),
        subject: `Velvet Ribbons enquiry — ${occasion}`,
        text: `Name: ${name.trim()}\nEmail: ${email.trim()}\nOccasion: ${occasion}\n\n${details.trim()}`,
        disableFileAccess: true,
        disableUrlAccess: true
      });
      if (!result.accepted?.length || result.rejected?.length) throw new Error('Delivery rejected');
      return response(200, 'Thank you! Your enquiry has been sent. We will reply within one business day.');
    } catch {
      // SMTP errors can include mailbox addresses and credentials; never return or log them.
      context.error('Contact email delivery failed.');
      return response(502, 'We could not send your enquiry right now. Please try again later or contact us on Instagram.');
    }
  };
}

module.exports = { createEnquiryHandler };
