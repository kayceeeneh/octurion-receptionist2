const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const tools = require('./tools');
const webhooks = require('./webhooks');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.LOG_LEVEL === 'debug' ? 'dev' : 'combined'));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.get('/health', (req, res) => res.json({ status: 'ok', business: process.env.BUSINESS_NAME }));

// ============================================================
// AI RECEPTIONIST TOOL ENDPOINTS
// Each maps 1:1 to a Retell AI function tool
// ============================================================

// --- BOOKING ---
app.post('/api/check-availability', async (req, res) => {
  try {
    const result = await tools.checkAvailability(req.body);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/book-appointment', async (req, res) => {
  try {
    const result = await tools.bookAppointment(req.body);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/cancel-appointment', async (req, res) => {
  try {
    const result = await tools.cancelAppointment(req.body);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/reschedule-appointment', async (req, res) => {
  try {
    const result = await tools.rescheduleAppointment(req.body);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CRM ---
app.post('/api/create-contact', async (req, res) => {
  try {
    const result = await tools.createContact(req.body);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/find-contact', async (req, res) => {
  try {
    const result = await tools.findContact(req.body);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- COMMUNICATION ---
app.post('/api/send-email', async (req, res) => {
  try {
    const result = await tools.sendEmail(req.body);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/send-sms', async (req, res) => {
  try {
    const result = await tools.sendSms(req.body);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SALES ---
app.post('/api/create-quote', async (req, res) => {
  try {
    const result = await tools.createQuote(req.body);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/qualify-lead', async (req, res) => {
  try {
    const result = await tools.qualifyLead(req.body);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SUPPORT ---
app.post('/api/create-ticket', async (req, res) => {
  try {
    const result = await tools.createTicket(req.body);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CALL HANDLING ---
app.post('/api/transfer-call', async (req, res) => {
  try {
    const result = await tools.transferCall(req.body);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/send-voicemail', async (req, res) => {
  try {
    const result = await tools.sendVoicemail(req.body);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- INFO ---
app.post('/api/get-business-hours', async (req, res) => {
  try {
    const result = await tools.getBusinessHours(req.body);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.use('/api/webhooks', webhooks);

app.listen(PORT, () => {
  console.log(`[OcturionTech AI Receptionist] Server running on port ${PORT}`);
  console.log(`[OcturionTech AI Receptionist] ${14} tool endpoints registered`);
});
