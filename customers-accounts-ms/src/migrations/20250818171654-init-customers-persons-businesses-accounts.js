'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) customers (pai)
    await queryInterface.createTable('customers', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      type: { type: Sequelize.ENUM('PERSON', 'BUSINESS'), allowNull: false },

      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      birthDate: { type: Sequelize.DATEONLY, allowNull: true },
      phone: { type: Sequelize.STRING, allowNull: true },

      street: { type: Sequelize.STRING, allowNull: true },
      number: { type: Sequelize.STRING, allowNull: true },
      district: { type: Sequelize.STRING, allowNull: true },
      city: { type: Sequelize.STRING, allowNull: true },
      state: { type: Sequelize.STRING, allowNull: true },
      zipCode: { type: Sequelize.STRING, allowNull: true },

      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // 2) persons (filha PF) — 1:1 com customers
    await queryInterface.createTable('persons', {
      customerId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'customers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      monthlyIncome: { type: Sequelize.DECIMAL(10,2), allowNull: true },
      cpf: { type: Sequelize.STRING, allowNull: false, unique: true },

      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // 3) businesses (filha PJ) — 1:1 com customers
    await queryInterface.createTable('businesses', {
      customerId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'customers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      cnpj: { type: Sequelize.STRING, allowNull: false, unique: true },
      isIcmsExempt: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      stateRegistration: { type: Sequelize.STRING, allowNull: true }, // validação no Yup

      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // 4) accounts — FK para customers
    await queryInterface.createTable('accounts', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      number: { type: Sequelize.STRING, allowNull: false, unique: true },
      branch: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.ENUM('CHECKING','SAVINGS','MERCHANT'), allowNull: false },
      balance: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0.0 },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },

      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('accounts', ['customerId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('accounts');
    await queryInterface.dropTable('businesses');
    await queryInterface.dropTable('persons');

    // remover a tabela 'customers' também remove o ENUM 'type' (MySQL por coluna)
    await queryInterface.dropTable('customers');
  }
};
