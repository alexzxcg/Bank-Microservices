'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Person extends Model {
    static associate(models) {
      this.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    }
  }

  Person.init(
    {
      customerId: { 
        type: DataTypes.INTEGER, primaryKey: true 
      },

      monthlyIncome: { 
        type: DataTypes.DECIMAL(10,2), 
        allowNull: true 
      },
      
      cpf: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true 
      },
    },
    { sequelize, modelName: 'Person', tableName: 'persons' }
  );

  return Person;
};
