const axios = require('axios');

const HUBSPOT_BASE = 'https://api.hubapi.com/crm/v3/objects';

async function createContact({ name, phone, email, notes }) {
  const payload = {
    properties: {
      firstname: (name || '').split(' ')[0],
      lastname: (name || '').split(' ').slice(1).join(' ') || name,
      phone,
      email,
      hs_notes: notes || '',
      hs_lead_status: 'NEW',
    },
  };

  if (process.env.HUBSPOT_ACCESS_TOKEN) {
    const { data } = await axios.post(`${HUBSPOT_BASE}/contacts`, payload, {
      headers: { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    });
    return { contact_id: data.id, status: 'created', name, phone, email };
  }

  // Fallback: return generated ID
  return { contact_id: `oct_${Date.now()}`, status: 'created (offline)', name, phone, email };
}

async function findContact({ phone }) {
  if (!phone) return { contact: null };

  if (process.env.HUBSPOT_ACCESS_TOKEN) {
    try {
      const { data } = await axios.post(
        `${HUBSPOT_BASE}/contacts/search`,
        { filterGroups: [{ filters: [{ propertyName: 'phone', operator: 'EQ', value: phone }] }] },
        { headers: { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
      );
      if (data.results?.length > 0) {
        const c = data.results[0];
        return {
          contact: {
            id: c.id,
            name: `${c.properties.firstname || ''} ${c.properties.lastname || ''}`.trim(),
            phone: c.properties.phone,
            email: c.properties.email,
            lead_status: c.properties.hs_lead_status,
          },
        };
      }
    } catch { /* not found */ }
  }

  return { contact: null };
}

module.exports = { createContact, findContact };
