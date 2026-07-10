// Webhook router for Zapier, Make, n8n automation triggers
const express = require('express');
const router = express.Router();

// Generic webhook receiver — forwards events to configured automation platforms
router.post('/zapier/:event', (req, res) => {
  const { event } = req.params;
  const payload = { event, timestamp: new Date().toISOString(), data: req.body };
  console.log(`[ZAPIER] Event: ${event}`, JSON.stringify(payload).slice(0, 500));
  res.json({ received: true, event });
});

router.post('/make/:event', (req, res) => {
  const { event } = req.params;
  const payload = { event, timestamp: new Date().toISOString(), data: req.body };
  console.log(`[MAKE] Event: ${event}`, JSON.stringify(payload).slice(0, 500));
  res.json({ received: true, event });
});

router.post('/n8n/:event', (req, res) => {
  const { event } = req.params;
  const payload = { event, timestamp: new Date().toISOString(), data: req.body };
  console.log(`[N8N] Event: ${event}`, JSON.stringify(payload).slice(0, 500));
  res.json({ received: true, event });
});

// Callback receiver for async operations
router.post('/callbacks/voicemail', (req, res) => {
  console.log('[CALLBACK] Voicemail transcription:', JSON.stringify(req.body).slice(0, 300));
  res.json({ received: true });
});

router.post('/callbacks/booking-confirmed', (req, res) => {
  console.log('[CALLBACK] Booking confirmed via external calendar:', JSON.stringify(req.body).slice(0, 300));
  res.json({ received: true });
});

module.exports = router;
