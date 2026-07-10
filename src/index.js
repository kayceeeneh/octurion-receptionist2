const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const tools = require('./tools');
const webhooks = require('./webhooks');
const { connectDB } = require('./db/connection');

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
// ============================================================

// --- BOOKING ---
app.post('/api/check-availability', async (req, res) => {
  try { res.json(await tools.checkAvailability(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/book-appointment', async (req, res) => {
  try { res.json(await tools.bookAppointment(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/cancel-appointment', async (req, res) => {
  try { res.json(await tools.cancelAppointment(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/reschedule-appointment', async (req, res) => {
  try { res.json(await tools.rescheduleAppointment(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CRM ---
app.post('/api/create-contact', async (req, res) => {
  try { res.json(await tools.createContact(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/find-contact', async (req, res) => {
  try { res.json(await tools.findContact(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// --- COMMUNICATION ---
app.post('/api/send-email', async (req, res) => {
  try { res.json(await tools.sendEmail(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/send-sms', async (req, res) => {
  try { res.json(await tools.sendSms(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SALES ---
app.post('/api/create-quote', async (req, res) => {
  try { res.json(await tools.createQuote(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/qualify-lead', async (req, res) => {
  try { res.json(await tools.qualifyLead(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SUPPORT ---
app.post('/api/create-ticket', async (req, res) => {
  try { res.json(await tools.createTicket(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CALL HANDLING ---
app.post('/api/transfer-call', async (req, res) => {
  try { res.json(await tools.transferCall(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/send-voicemail', async (req, res) => {
  try { res.json(await tools.sendVoicemail(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// --- INFO ---
app.post('/api/get-business-hours', async (req, res) => {
  try { res.json(await tools.getBusinessHours(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.use('/api/webhooks', webhooks);

// --- CRM data read endpoints ---
app.get('/api/customers', async (req, res) => {
  try {
    const { getModels } = require('./db/models');
    res.json(await getModels().Customer.find().sort({ createdAt: -1 }).limit(50).lean());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/appointments', async (req, res) => {
  try {
    const { getModels } = require('./db/models');
    res.json(await getModels().Appointment.find().sort({ createdAt: -1 }).limit(50).lean());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/conversations', async (req, res) => {
  try {
    const { getModels } = require('./db/models');
    res.json(await getModels().Conversation.find().sort({ createdAt: -1 }).limit(50).lean());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/tickets', async (req, res) => {
  try {
    const { getModels } = require('./db/models');
    res.json(await getModels().Ticket.find().sort({ createdAt: -1 }).limit(50).lean());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/stats', async (req, res) => {
  try {
    const { getModels } = require('./db/models');
    const m = getModels();
    const [calls, customers, appointments, tickets, voicemails] = await Promise.all([
      m.Conversation.countDocuments(), m.Customer.countDocuments(),
      m.Appointment.countDocuments(), m.Ticket.countDocuments(), m.Voicemail.countDocuments(),
    ]);
    res.json({ calls, customers, appointments, tickets, voicemails });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Startup ---
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[OcturionTech AI Receptionist] Server running on port ${PORT}`);
    console.log(`[OcturionTech AI Receptionist] ${14} tool endpoints registered`);
    console.log(`[OcturionTech AI Receptionist] GET /api/conversations, /api/customers, /api/appointments, /api/tickets, /api/stats`);
  });
}

start();
