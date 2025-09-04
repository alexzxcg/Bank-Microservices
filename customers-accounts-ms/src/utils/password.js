const bcrypt = require('bcryptjs');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
const PEPPER = process.env.PASSWORD_PEPPER || '';

async function hashPassword(plain) {
  return bcrypt.hash(String(plain) + PEPPER, SALT_ROUNDS);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(String(plain) + PEPPER, hash);
}

module.exports = { hashPassword, comparePassword };
