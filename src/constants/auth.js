const { MASTER_USERNAME, MASTER_PASSWORD } = require('../config/env');

module.exports = {
  MASTER_USERNAME,
  MASTER_PASSWORD,
  USER_ROLES: ['subscriber', 'master'],
  USER_PLANS: ['monthly', 'quarterly', 'lifetime', 'trial', 'master']
};
