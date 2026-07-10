const { getModels } = require('../db/models');

async function sendEmail({ to, subject, body }) {
  let status = 'logged', provider = 'console', externalId = null;

  if (process.env.SENDGRID_API_KEY) {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send({
        to, from: process.env.SENDGRID_FROM_EMAIL || 'noreply@octuriontech.com',
        subject: `[OcturionTech] ${subject}`, text: body,
        html: body.replace(/\n/g, '<br>'),
      });
      status = 'sent'; provider = 'sendgrid';
    } catch (e) {
      console.error('[EMAIL] SendGrid error:', e.message);
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const axios = require('axios');
      await axios.post('https://api.resend.com/emails', {
        from: process.env.RESEND_FROM_EMAIL || 'noreply@octuriontech.com',
        to, subject: `[OcturionTech] ${subject}`, text: body,
      }, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' } });
      status = 'sent'; provider = 'resend';
    } catch (e) {
      console.error('[EMAIL] Resend error:', e.message);
    }
  }

  const models = getModels();
  try {
    await models.Message.create({ channel: 'email', direction: 'outbound', to, subject, body, status, provider, externalId });
  } catch (e) {
    console.error('[EMAIL] MongoDB save error:', e.message);
  }

  return { status, provider, to, subject };
}

async function sendSms({ to, message }) {
  let status = 'logged', provider = 'console', externalId = null;

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const result = await twilio.messages.create({
        body: `[OcturionTech] ${message}`, from: process.env.TWILIO_PHONE_NUMBER, to,
      });
      status = 'sent'; provider = 'twilio';
      externalId = result.sid;
    } catch (e) {
      console.error('[SMS] Twilio error:', e.message);
    }
  }

  const models = getModels();
  try {
    await models.Message.create({ channel: 'sms', direction: 'outbound', to, body: message, status, provider, externalId });
  } catch (e) {
    console.error('[SMS] MongoDB save error:', e.message);
  }

  return { status, provider, to, message_id: externalId };
}

module.exports = { sendEmail, sendSms };
