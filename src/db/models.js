const { mongoose } = require('./connection');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  notes: String,
  tags: [String],
  source: { type: String, default: 'ai-receptionist' },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const appointmentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  title: String,
  service: String,
  date: String,
  time: String,
  startDatetime: Date,
  endDatetime: Date,
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'cancelled', 'rescheduled', 'pending_calendar_setup'],
    default: 'scheduled',
  },
  bookingRef: String,
  googleEventId: String,
  notes: String,
}, { timestamps: true });

const conversationSchema = new mongoose.Schema({
  callId: String,
  sessionId: String,
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerPhone: String,
  customerName: String,
  channel: { type: String, default: 'voice' },
  status: {
    type: String,
    enum: ['active', 'completed', 'missed', 'voicemail', 'escalated'],
    default: 'completed',
  },
  duration: Number,
  transcript: mongoose.Schema.Types.Mixed,
  summary: String,
  sentiment: String,
  recordingUrl: String,
  voicemailUrl: String,
  escalatedTo: String,
  notes: String,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const ticketSchema = new mongoose.Schema({
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  issue: String,
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, default: 'open' },
  assignedTo: String,
  responseTimeHours: Number,
}, { timestamps: true });

const quoteSchema = new mongoose.Schema({
  quoteId: String,
  customerName: String,
  customerEmail: String,
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number,
  }],
  subtotal: Number,
  tax: Number,
  grandTotal: Number,
  currency: { type: String, default: 'USD' },
  validUntil: String,
  status: { type: String, default: 'draft' },
  pdfUrl: String,
}, { timestamps: true });

const voicemailSchema = new mongoose.Schema({
  callerName: String,
  callerPhone: String,
  message: String,
  urgency: { type: String, enum: ['normal', 'high'], default: 'normal' },
  transcribed: { type: Boolean, default: true },
  callbackScheduled: { type: Boolean, default: true },
  duration: Number,
}, { timestamps: true });

const leadSchema = new mongoose.Schema({
  name: String,
  phone: String,
  budget: String,
  need: String,
  timeline: String,
  score: Number,
  recommendation: String,
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: String,
  customerPhone: String,
  channel: { type: String, enum: ['email', 'sms'], required: true },
  direction: { type: String, enum: ['outbound'], default: 'outbound' },
  to: String,
  subject: String,
  body: String,
  status: { type: String, default: 'sent' },
  provider: String,
  externalId: String,
}, { timestamps: true });

let Customer, Appointment, Conversation, Ticket, Quote, Voicemail, Lead, Message;

function getModels() {
  if (!Customer) {
    Customer = mongoose.model('Customer', customerSchema);
    Appointment = mongoose.model('Appointment', appointmentSchema);
    Conversation = mongoose.model('Conversation', conversationSchema);
    Ticket = mongoose.model('Ticket', ticketSchema);
    Quote = mongoose.model('Quote', quoteSchema);
    Voicemail = mongoose.model('Voicemail', voicemailSchema);
    Lead = mongoose.model('Lead', leadSchema);
    Message = mongoose.model('Message', messageSchema);
  }
  return { Customer, Appointment, Conversation, Ticket, Quote, Voicemail, Lead, Message };
}

module.exports = { getModels };
