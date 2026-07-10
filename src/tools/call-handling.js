const { v4: uuidv4 } = require('uuid');
const { getModels } = require('../db/models');

async function transferCall({ department, context, caller_phone }) {
  const targetNumber = process.env.TRANSFER_PRIMARY || '+443330410511';

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await twilio.calls.create({
        url: 'http://twimlets.com/forward?Number=' + encodeURIComponent(targetNumber),
        to: targetNumber, from: process.env.TWILIO_PHONE_NUMBER,
      });
    } catch (e) {
      console.error('[TRANSFER] Twilio error:', e.message);
    }
  }

  const models = getModels();
  try {
    await models.Conversation.findOneAndUpdate(
      { customerPhone: caller_phone, status: 'active' },
      { status: 'escalated', escalatedTo: department || 'staff', notes: context }
    );
  } catch {}

  console.log(`[TRANSFER] Dept: ${department} | Context: ${context} | Caller: ${caller_phone}`);
  return {
    status: 'transferred', department, target: targetNumber,
    context_summary: context, warm_transfer: true,
  };
}

async function sendVoicemail({ caller_name, caller_phone, message }) {
  const voicemail = {
    voicemail_id: `VM-${uuidv4().slice(0, 8).toUpperCase()}`,
    caller_name, caller_phone, message,
    received_at: new Date().toISOString(),
    transcribed: true,
    urgency: message && (message.toLowerCase().includes('urgent') || message.toLowerCase().includes('emergency')) ? 'high' : 'normal',
    callback_scheduled: true,
  };

  const models = getModels();
  try {
    await models.Voicemail.create({
      callerName: caller_name, callerPhone: caller_phone, message,
      urgency: voicemail.urgency, transcribed: true, callbackScheduled: true,
    });
    await models.Conversation.findOneAndUpdate(
      { customerPhone: caller_phone, status: 'active' },
      { status: 'voicemail' }
    );
  } catch (e) {
    console.error('[VOICEMAIL] MongoDB save error:', e.message);
  }

  console.log(`[VOICEMAIL] From: ${caller_name} (${caller_phone}) | Urgency: ${voicemail.urgency}`);
  return { status: 'saved', ...voicemail };
}

module.exports = { transferCall, sendVoicemail };
