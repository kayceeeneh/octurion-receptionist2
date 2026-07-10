const businessHours = {
  monday:    { open: '09:00', close: '17:00' },
  tuesday:   { open: '09:00', close: '17:00' },
  wednesday: { open: '09:00', close: '17:00' },
  thursday:  { open: '09:00', close: '17:00' },
  friday:    { open: '09:00', close: '17:00' },
  saturday:  { open: null, close: null },
  sunday:    { open: null, close: null },
};

const holidays = {
  '2025-12-25': { name: 'Christmas Day', closed: true },
  '2025-12-26': { name: 'Boxing Day', closed: true },
  '2026-01-01': { name: "New Year's Day", closed: true },
};

function getBusinessHours({ date }) {
  if (date) {
    const holiday = holidays[date];
    if (holiday) {
      return { date, status: 'closed', reason: holiday.name, message: `We are closed on ${holiday.name}.` };
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const d = new Date(date + 'T12:00:00');
    const dayName = dayNames[d.getDay()];
    const hours = businessHours[dayName];

    if (!hours.open) {
      return { date, status: 'closed', message: 'We are closed on this day.' };
    }

    return {
      date,
      status: 'open',
      hours: `${hours.open} - ${hours.close}`,
      timezone: 'UTC',
      message: `We are open from ${hours.open} to ${hours.close}.`,
    };
  }

  // Return weekly schedule
  const schedule = {};
  for (const [day, hrs] of Object.entries(businessHours)) {
    schedule[day] = hrs.open ? `${hrs.open} - ${hrs.close}` : 'Closed';
  }
  return { weekly_schedule: schedule, timezone: 'UTC', holidays: Object.keys(holidays) };
}

module.exports = { getBusinessHours };
