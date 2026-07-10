const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const { getModels } = require('../db/models');

function getCalendar() {
  const pk = process.env.GOOGLE_PRIVATE_KEY || '';
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !pk.startsWith('-----BEGIN')) return null;
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, null,
    (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/calendar']
  );
  return google.calendar({ version: 'v3', auth });
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const DURATION_MINUTES = 30;
const BUFFER_MINUTES = 15;

async function checkAvailability({ date, service }) {
  const calendar = getCalendar();
  if (!calendar) {
    const slots = [];
    for (let h = 9; h <= 16; h++) {
      slots.push({ time: `${h.toString().padStart(2, '0')}:00`, iso: `${date}T${h.toString().padStart(2, '0')}:00:00`, duration: 30 });
    }
    return { date, service, slots, total_available: slots.length, note: 'Calendar not connected — showing default slots' };
  }
  const dayStart = new Date(`${date}T08:00:00`);
  const dayEnd = new Date(`${date}T18:00:00`);
  const { data } = await calendar.events.list({
    calendarId: CALENDAR_ID, timeMin: dayStart.toISOString(), timeMax: dayEnd.toISOString(),
    singleEvents: true, orderBy: 'startTime',
  });
  const busy = (data.items || []).map(e => ({
    start: new Date(e.start.dateTime || e.start.date).getTime(),
    end: new Date(e.end.dateTime || e.end.date).getTime(),
  }));
  const slots = [];
  let cursor = dayStart.getTime();
  const end = dayEnd.getTime();
  while (cursor + DURATION_MINUTES * 60000 <= end) {
    const slotEnd = cursor + DURATION_MINUTES * 60000;
    const conflict = busy.some(b => cursor < b.end && slotEnd > b.start);
    if (!conflict) {
      slots.push({
        time: new Date(cursor).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        iso: new Date(cursor).toISOString(), duration: DURATION_MINUTES,
      });
    }
    cursor += (DURATION_MINUTES + BUFFER_MINUTES) * 60000;
  }
  return { date, service, slots, total_available: slots.length };
}

async function bookAppointment({ customer_name, customer_phone, customer_email, service, date, time }) {
  const calendar = getCalendar();
  const booking_ref = uuidv4().slice(0, 8).toUpperCase();
  let googleEventId = null;

  if (calendar) {
    const start = new Date(`${date}T${time}`);
    const end = new Date(start.getTime() + DURATION_MINUTES * 60000);
    try {
      const { data } = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: {
          summary: `${service} - ${customer_name}`,
          description: `Service: ${service}\nPhone: ${customer_phone}\nEmail: ${customer_email}\nBooking Ref: ${booking_ref}`,
          start: { dateTime: start.toISOString(), timeZone: 'UTC' },
          end: { dateTime: end.toISOString(), timeZone: 'UTC' },
          attendees: customer_email ? [{ email: customer_email }] : [],
          reminders: { useDefault: false, overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 120 },
          ]},
        },
      });
      googleEventId = data.id;
    } catch (e) {
      console.error('[BOOKING] Google Calendar error:', e.message);
    }
  }

  // Persist to MongoDB
  const models = getModels();
  try {
    await models.Appointment.create({
      customerName: customer_name,
      customerPhone: customer_phone,
      customerEmail: customer_email,
      service, date, time,
      startDatetime: new Date(`${date}T${time}`),
      endDatetime: new Date(new Date(`${date}T${time}`).getTime() + DURATION_MINUTES * 60000),
      status: googleEventId ? 'confirmed' : 'pending_calendar_setup',
      bookingRef: booking_ref,
      googleEventId,
    });
  } catch (e) {
    console.error('[BOOKING] MongoDB save error:', e.message);
  }

  return {
    booking_id: googleEventId || booking_ref,
    status: googleEventId ? 'confirmed' : 'pending_calendar_setup',
    date, time, service, customer_name,
    confirmation_link: googleEventId ? `https://calendar.google.com/calendar/event?eid=${googleEventId}` : null,
  };
}

async function cancelAppointment({ booking_id, reason }) {
  const calendar = getCalendar();
  if (calendar) {
    try { await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: booking_id }); } catch {}
  }
  const models = getModels();
  try {
    await models.Appointment.findOneAndUpdate(
      { $or: [{ bookingRef: booking_id }, { googleEventId: booking_id }] },
      { status: 'cancelled', notes: reason }
    );
  } catch {}
  return { status: 'cancelled', booking_id, reason, refund_eligible: true };
}

async function rescheduleAppointment({ booking_id, new_date, new_time }) {
  const calendar = getCalendar();
  let updatedEventLink = null;
  if (calendar) {
    const start = new Date(`${new_date}T${new_time}`);
    const end = new Date(start.getTime() + DURATION_MINUTES * 60000);
    try {
      const { data } = await calendar.events.patch({
        calendarId: CALENDAR_ID, eventId: booking_id,
        requestBody: {
          start: { dateTime: start.toISOString(), timeZone: 'UTC' },
          end: { dateTime: end.toISOString(), timeZone: 'UTC' },
        },
      });
      updatedEventLink = data.htmlLink;
    } catch {}
  }
  const models = getModels();
  try {
    await models.Appointment.findOneAndUpdate(
      { $or: [{ bookingRef: booking_id }, { googleEventId: booking_id }] },
      { status: 'rescheduled', date: new_date, time: new_time }
    );
  } catch {}
  return { status: 'rescheduled', booking_id, new_date, new_time, updated_event: updatedEventLink };
}

module.exports = { checkAvailability, bookAppointment, cancelAppointment, rescheduleAppointment };
