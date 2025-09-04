'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'accounts'
        AND COLUMN_NAME = 'customerId'
        AND REFERENCED_TABLE_NAME = 'customers'
    `);

    for (const r of rows) {
      await queryInterface.removeConstraint('accounts', r.CONSTRAINT_NAME);
    }

    await queryInterface.addConstraint('accounts', {
      fields: ['customerId'],
      type: 'foreign key',
      name: 'fk_accounts_customerId', 
      references: { table: 'customers', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('accounts', 'fk_accounts_customerId');

    await queryInterface.addConstraint('accounts', {
      fields: ['customerId'],
      type: 'foreign key',
      name: 'fk_accounts_customerId',
      references: { table: 'customers', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },
};
