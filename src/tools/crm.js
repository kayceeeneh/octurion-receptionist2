const axios = require('axios');
const { getModels } = require('../db/models');

const HUBSPOT_BASE = 'https://api.hubapi.com/crm/v3/objects';

async function createContact({ name, phone, email, notes }) {
  let hubspotId = null;

  if (process.env.HUBSPOT_ACCESS_TOKEN) {
    try {
      const { data } = await axios.post(`${HUBSPOT_BASE}/contacts`, {
        properties: {
          firstname: (name || '').split(' ')[0],
          lastname: (name || '').split(' ').slice(1).join(' ') || name,
          phone, email,
          hs_notes: notes || '',
          hs_lead_status: 'NEW',
        },
      }, { headers: { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } });
      hubspotId = data.id;
    } catch (e) {
      console.error('[CRM] HubSpot error:', e.message);
    }
  }

  const models = getModels();
  let dbContact = null;
  try {
    dbContact = await models.Customer.create({ name, phone, email, notes, tags: ['ai-created'], source: 'ai-receptionist' });
  } catch (e) {
    console.error('[CRM] MongoDB save error:', e.message);
  }

  return {
    contact_id: hubspotId || (dbContact ? dbContact._id.toString() : `oct_${Date.now()}`),
    status: hubspotId ? 'created' : 'created (local)',
    name, phone, email,
  };
}

async function findContact({ phone }) {
  if (!phone) return { contact: null };

  // Search local MongoDB first
  const models = getModels();
  try {
    const contact = await models.Customer.findOne({ phone });
    if (contact) {
      return {
        contact: {
          id: contact._id.toString(),
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          notes: contact.notes,
          source: contact.source,
        },
      };
    }
  } catch {}

  // Fallback to HubSpot
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
            id: c.id, name: `${c.properties.firstname || ''} ${c.properties.lastname || ''}`.trim(),
            phone: c.properties.phone, email: c.properties.email,
            lead_status: c.properties.hs_lead_status,
          },
        };
      }
    } catch {}
  }

  return { contact: null };
}

module.exports = { createContact, findContact };
