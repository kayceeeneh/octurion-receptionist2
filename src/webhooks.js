const express = require('express');
const { getModels } = require('./db/models');

const router = express.Router();

// --- Retell AI post-call webhook ---
router.post('/retell', async (req, res) => {
  const payload = req.body;
  console.log('[RETELL] Webhook received:', JSON.stringify(payload).slice(0, 500));

  const models = getModels();
  try {
    await models.Conversation.create({
      callId: payload.call_id,
      sessionId: `call_${Date.now()}`,
      customerPhone: payload.from_number || payload.caller_number,
      customerName: payload.caller_name,
      channel: 'voice',
      status: payload.call_type === 'voicemail' ? 'voicemail' : 'completed',
      duration: payload.duration_seconds || payload.duration,
      transcript: payload.transcript || { messages: payload.transcript_object || [] },
      summary: payload.summary,
      sentiment: payload.sentiment,
      recordingUrl: payload.recording_url || payload.recording_link,
      metadata: payload,
    });
  } catch (e) {
    console.error('[RETELL] MongoDB save error:', e.message);
  }

  res.json({ received: true });
});

// --- Zapier ---
router.post('/zapier/:event', (req, res) => {
  const { event } = req.params;
  console.log(`[ZAPIER] Event: ${event}`, JSON.stringify(req.body).slice(0, 500));
  res.json({ received: true, event });
});

// --- Make ---
router.post('/make/:event', (req, res) => {
  const { event } = req.params;
  console.log(`[MAKE] Event: ${event}`, JSON.stringify(req.body).slice(0, 500));
  res.json({ received: true, event });
});

// --- n8n ---
router.post('/n8n/:event', (req, res) => {
  const { event } = req.params;
  console.log(`[N8N] Event: ${event}`, JSON.stringify(req.body).slice(0, 500));
  res.json({ received: true, event });
});

// --- Callbacks ---
router.post('/callbacks/voicemail', (req, res) => {
  console.log('[CALLBACK] Voicemail transcription:', JSON.stringify(req.body).slice(0, 300));
  res.json({ received: true });
});

router.post('/callbacks/booking-confirmed', (req, res) => {
  console.log('[CALLBACK] Booking confirmed:', JSON.stringify(req.body).slice(0, 300));
  res.json({ received: true });
});

// --- CRM-facing read endpoints ---
router.get('/conversations', async (req, res) => {
  const models = getModels();
  try {
    const conversations = await models.Conversation.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(conversations);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/customers', async (req, res) => {
  const models = getModels();
  try {
    const customers = await models.Customer.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(customers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/appointments', async (req, res) => {
  const models = getModels();
  try {
    const appointments = await models.Appointment.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(appointments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/tickets', async (req, res) => {
  const models = getModels();
  try {
    const tickets = await models.Ticket.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(tickets);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/messages', async (req, res) => {
  const models = getModels();
  try {
    const messages = await models.Message.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(messages);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/stats', async (req, res) => {
  const models = getModels();
  try {
    const [calls, customers, appointments, tickets, voicemails] = await Promise.all([
      models.Conversation.countDocuments(),
      models.Customer.countDocuments(),
      models.Appointment.countDocuments(),
      models.Ticket.countDocuments(),
      models.Voicemail.countDocuments(),
    ]);
    res.json({ calls, customers, appointments, tickets, voicemails });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
