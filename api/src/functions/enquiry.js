const { app } = require('@azure/functions');
const nodemailer = require('nodemailer');
const { createEnquiryHandler } = require('../enquiry');

app.http('enquiry', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createEnquiryHandler({
    sendMail: async message => {
      const port = Number(process.env.SMTP_PORT || 465);
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port,
        secure: port === 465,
        requireTLS: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        dnsTimeout: 10000,
        disableFileAccess: true,
        disableUrlAccess: true
      });
      return transport.sendMail(message);
    }
  })
});
