require('dotenv').config();

module.exports = {
  JWT_SECRET:  process.env.JWT_SECRET,
  JWT_EXPIRES: process.env.JWT_EXPIRES || '15m',
  JWT_ISS:     process.env.JWT_ISS || 'customers-accounts-ms',
  JWT_AUD:     process.env.JWT_AUD || 'customers-accounts',
};
