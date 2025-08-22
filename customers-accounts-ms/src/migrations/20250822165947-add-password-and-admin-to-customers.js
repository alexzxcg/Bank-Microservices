'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('customers', 'type', {
      type: Sequelize.ENUM('PERSON', 'BUSINESS', 'ADMIN'),
      allowNull: false,
    });

    await queryInterface.addColumn('customers', 'passwordHash', {
      type: Sequelize.STRING,
      allowNull: false,
      after: 'email',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('customers', 'passwordHash');
    await queryInterface.changeColumn('customers', 'type', {
      type: Sequelize.ENUM('PERSON', 'BUSINESS'),
      allowNull: false,
    });
  },
};
