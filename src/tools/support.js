const { v4: uuidv4 } = require('uuid');
const { getModels } = require('../db/models');

async function createTicket({ customer_name, issue, priority }) {
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  const p = validPriorities.includes(priority) ? priority : 'medium';
  const ticket = {
    ticket_id: `TKT-${uuidv4().slice(0, 8).toUpperCase()}`,
    customer_name, issue, priority: p,
    status: 'open',
    created_at: new Date().toISOString(),
    assigned_to: null,
    response_time_hours: p === 'urgent' ? 1 : p === 'high' ? 4 : 24,
  };

  const models = getModels();
  try {
    await models.Ticket.create({
      customerName: customer_name, issue, priority: p, status: 'open',
      responseTimeHours: ticket.response_time_hours,
    });
  } catch (e) {
    console.error('[TICKET] MongoDB save error:', e.message);
  }

  console.log(`[TICKET] Created ${ticket.ticket_id} (${p}) for ${customer_name}: ${issue.slice(0, 60)}`);
  return ticket;
}

module.exports = { createTicket };
