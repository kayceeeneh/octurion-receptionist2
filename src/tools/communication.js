const axios = require('axios');

async function sendEmail({ to, subject, body }) {
  if (process.env.SENDGRID_API_KEY) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@octuriontech.com',
      subject: `[OcturionTech] ${subject}`,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    });
    return { status: 'sent', provider: 'sendgrid', to, subject };
  }

  // Fallback: log to console
  console.log(`[EMAIL] To: ${to} | Subject: ${subject} | Body: ${body}`);
  return { status: 'logged', provider: 'console', to, subject };
}

async function sendSms({ to, message }) {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const result = await twilio.messages.create({
      body: `[OcturionTech] ${message}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    return { status: 'sent', provider: 'twilio', message_id: result.sid, to };
  }

  console.log(`[SMS] To: ${to} | Message: ${message}`);
  return { status: 'logged', provider: 'console', to };
}

module.exports = { sendEmail, sendSms };
