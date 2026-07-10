const bookingTools = require('./booking');
const crmTools = require('./crm');
const commTools = require('./communication');
const salesTools = require('./sales');
const supportTools = require('./support');
const callTools = require('./call-handling');
const infoTools = require('./info');

module.exports = {
  ...bookingTools,
  ...crmTools,
  ...commTools,
  ...salesTools,
  ...supportTools,
  ...callTools,
  ...infoTools,
};
