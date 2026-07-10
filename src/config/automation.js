// ============================================================
// Automation Workflow Templates
// Deploy as Zapier webhooks, Make scenarios, or n8n workflows
// ============================================================

module.exports = {
  version: '1.0.0',
  business: 'OcturionTech',

  // Zapier — create Zaps using these webhook URLs
  zapier: {
    webhook_base: `${process.env.SERVER_URL || 'https://your-server.com'}/api/webhooks/zapier`,
    zaps: [
      {
        name: 'New Booking → Slack + CRM + Email',
        trigger: { event: 'booking.created', endpoint: '/booking-created' },
        actions: [
          'Slack: Post to #bookings channel',
          'HubSpot: Update contact with last booking date',
          'SendGrid: Send confirmation email to customer',
          'Google Sheets: Add row to bookings log',
        ],
      },
      {
        name: 'Cancellation → CRM + Follow-up',
        trigger: { event: 'booking.cancelled', endpoint: '/booking-cancelled' },
        actions: [
          'HubSpot: Log cancellation reason on contact',
          'Slack: Post to #bookings with reason',
          'Google Sheets: Update booking status',
          'Schedule: Add win-back follow-up in 30 days',
        ],
      },
      {
        name: 'New Lead → CRM + Email Sequence',
        trigger: { event: 'lead.captured', endpoint: '/lead-captured' },
        actions: [
          'HubSpot: Create contact and lead record',
          'Mailchimp: Add to nurture sequence',
          'Slack: Post to #sales-leads channel',
          'Calendar: Schedule sales call reminder',
        ],
      },
    ],
  },

  // Make (Integromat) — scenario blueprints
  make: {
    webhook_url: `${process.env.SERVER_URL || 'https://your-server.com'}/api/webhooks/make`,
    scenarios: [
      {
        id: 'booking_pipeline',
        name: 'Booking Pipeline',
        trigger: 'Receive webhook → booking.created',
        modules: [
          { app: 'Webhooks', event: 'Receive a webhook' },
          { app: 'Google Calendar', event: 'Create an event' },
          { app: 'HubSpot CRM', event: 'Create/Update Contact' },
          { app: 'Slack', event: 'Send a Channel Message' },
          { app: 'Email', event: 'Send an Email' },
        ],
      },
      {
        id: 'lead_nurture',
        name: 'Lead Nurture Sequence',
        trigger: 'Receive webhook → lead.captured',
        modules: [
          { app: 'Webhooks', event: 'Receive a webhook' },
          { app: 'HubSpot CRM', event: 'Create Contact' },
          { app: 'Slack', event: 'Send DM to sales rep' },
          { app: 'Gmail', event: 'Send Email (intro)' },
          { app: 'Schedule', event: 'Schedule follow-up task' },
        ],
      },
    ],
  },

  // n8n — self-hosted workflow templates
  n8n: {
    workflows: [
      {
        name: 'Voice → CRM Pipeline',
        nodes: [
          { name: 'Webhook Trigger', type: 'n8n-nodes-base.webhook', options: { path: 'voice-crm' } },
          { name: 'HubSpot', type: 'n8n-nodes-base.hubspot', operation: 'upsert', resource: 'contact' },
          { name: 'Google Calendar', type: 'n8n-nodes-base.googleCalendar', operation: 'create' },
          { name: 'Slack', type: 'n8n-nodes-base.slack', operation: 'postMessage' },
          { name: 'Twilio', type: 'n8n-nodes-base.twilio', operation: 'sendSms' },
          { name: 'IF Condition', type: 'n8n-nodes-base.if', condition: '{{$json.score >= 7}}' },
          { name: 'Email (SendGrid)', type: 'n8n-nodes-base.sendGrid', operation: 'send' },
        ],
      },
      {
        name: 'Voicemail → Task',
        nodes: [
          { name: 'Webhook Trigger', type: 'n8n-nodes-base.webhook', options: { path: 'voicemail' } },
          { name: 'Set Priority', type: 'n8n-nodes-base.set', values: { priority: '{{$json.urgency}}' } },
          { name: 'Create Todoist Task', type: 'n8n-nodes-base.todoist', operation: 'create' },
          { name: 'Slack Alert', type: 'n8n-nodes-base.slack', operation: 'postMessage' },
        ],
      },
    ],
  },
};
