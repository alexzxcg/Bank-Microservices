'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Account extends Model {
    static associate(models) {
      this.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    }
  }

  Account.init(
    {
      number: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true 
      },

      branch: { 
        type: DataTypes.STRING, 
        allowNull: false 
      },

      type: { 
        type: DataTypes.ENUM('CHECKING','SAVINGS','MERCHANT'), 
        allowNull: false 
      },

      balance: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false, 
        defaultValue: 0.0 
      },

      active: { 
        type: DataTypes.BOOLEAN, 
        allowNull: false, 
        defaultValue: true 
      },
      
      customerId: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
    },
    { sequelize, modelName: 'Account', tableName: 'accounts' }
  );

  return Account;
};
