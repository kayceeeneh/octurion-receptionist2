const { v4: uuidv4 } = require('uuid');

async function createQuote({ customer_name, customer_email, items }) {
  const total = (items || []).reduce((sum, item) => {
    return sum + parseFloat(item.price || item.amount || 0);
  }, 0);

  const quote = {
    quote_id: `QTE-${uuidv4().slice(0, 8).toUpperCase()}`,
    customer_name,
    customer_email,
    items: (items || []).map(i => ({
      description: i.description || i.name || i,
      quantity: i.quantity || 1,
      unit_price: parseFloat(i.price || i.amount || 0),
      total: parseFloat(i.price || i.amount || 0) * (i.quantity || 1),
    })),
    subtotal: total,
    tax: total * 0.08,
    grand_total: total * 1.08,
    currency: 'USD',
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    pdf_url: null,
  };

  console.log(`[QUOTE] Created quote ${quote.quote_id} for ${customer_name}: $${quote.grand_total.toFixed(2)}`);
  return quote;
}

async function qualifyLead({ name, phone, budget, need, timeline }) {
  let score = 5;

  if (budget) {
    const budgetNum = parseFloat(budget.replace(/[^0-9.]/g, ''));
    if (budgetNum > 10000) score += 2;
    else if (budgetNum > 1000) score += 1;
  }

  if (need && need.length > 10) score += 1;
  if (timeline) {
    const t = timeline.toLowerCase();
    if (t.includes('asap') || t.includes('urgent') || t.includes('immediately')) score += 2;
    else if (t.includes('month') || t.includes('week')) score += 1;
    else score -= 1;
  }

  score = Math.max(1, Math.min(10, score));

  let recommendation = 'nurture';
  if (score >= 7) recommendation = 'book consultation';
  else if (score >= 4) recommendation = 'send info and follow up';

  return { score, recommendation, name, phone, budget, need, timeline, timestamp: new Date().toISOString() };
}

module.exports = { createQuote, qualifyLead };
