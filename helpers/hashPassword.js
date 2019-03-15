const crypto = require('crypto');
const config = require('../config');

function hashPassword(str) {
  if ((typeof (str) !== 'string') || str.length < 0) {
    return false;
  }

  const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');

  return hash;
};

module.exports = hashPassword;
