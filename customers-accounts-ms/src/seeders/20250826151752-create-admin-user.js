'use strict';
const bcrypt = require('bcryptjs');
require('dotenv').config();

module.exports = {
  async up(queryInterface, Sequelize) {
    const password = process.env.ADMIN_PASSWORD || 'default@123';
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const name = process.env.ADMIN_NAME || 'System Admin';

    const passwordHash = await bcrypt.hash(password, 10);

    await queryInterface.bulkInsert('customers', [{
      type: 'ADMIN',
      name,
      email,
      passwordHash,
      birthDate: null,
      phone: null,
      street: null,
      number: null,
      district: null,
      city: null,
      state: null,
      zipCode: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    await queryInterface.bulkDelete('customers', { email }, {});
  }
};