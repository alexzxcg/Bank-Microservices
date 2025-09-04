'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {
      this.hasOne(models.Person, {
        foreignKey: 'customerId',
        as: 'person',
        onDelete: 'CASCADE',
        hooks: true,
      });

      this.hasOne(models.Business, {
        foreignKey: 'customerId',
        as: 'business',
        onDelete: 'CASCADE',
        hooks: true,
      });

      this.hasMany(models.Account, {
        foreignKey: 'customerId',
        as: 'accounts',
        onDelete: 'CASCADE',
        hooks: true,
      });

    }
  }

  Customer.init(
    {
      type: {
        type: DataTypes.ENUM('PERSON', 'BUSINESS', 'ADMIN'),
        allowNull: false
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },

      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
      },

      birthDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },

      street: {
        type: DataTypes.STRING,
        allowNull: true
      },
      number: {
        type: DataTypes.STRING,
        allowNull: true
      },
      district: {
        type: DataTypes.STRING,
        allowNull: true
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true
      },
      zipCode: {
        type: DataTypes.STRING,
        allowNull: true
      },
    },
    { sequelize, modelName: 'Customer', tableName: 'customers' }
  );

  return Customer;
};
