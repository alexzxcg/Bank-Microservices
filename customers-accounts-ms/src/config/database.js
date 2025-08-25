require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER_NODE,
    password: process.env.DB_PASSWORD_NODE,
    database: process.env.DB_NAME_NODE,
    host: '127.0.0.1',
    dialect: 'mysql'
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_PROD,
    host: process.env.DB_HOST,
    dialect: 'mysql'
  }
};
