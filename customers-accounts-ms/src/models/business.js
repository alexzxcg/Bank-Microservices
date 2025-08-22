'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Business extends Model {
    static associate(models) {
      this.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    }
  }

  Business.init(
    {
      customerId: { 
        type: DataTypes.INTEGER, 
        primaryKey: true 
      },

      cnpj: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true 
      },

      isIcmsExempt: { 
        type: DataTypes.BOOLEAN, 
        allowNull: false, 
        defaultValue: true 
      },
      
      stateRegistration: { 
        type: DataTypes.STRING, 
        allowNull: true 
      },
    },
    { sequelize, modelName: 'Business', tableName: 'businesses' }
  );

  return Business;
};
