const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME_NODE,
    process.env.DB_USER_NODE,
    process.env.DB_PASSWORD_NODE,
    {
      host: process.env.DB_HOST_NODE,
      dialect: process.env.DB_DIALECT_NODE,
    }
  );

async function testarConexao() {
  try {
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso!');
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados:', error);
  } finally {
    await sequelize.close();
  }
}

console.log('Tentando conectar com:');
console.log('Usuário:', process.env.DB_USER_NODE);
console.log('Senha:', process.env.DB_PASSWORD_NODE);
console.log('Banco:', process.env.DB_NAME_NODE);
console.log('Host:', process.env.DB_HOST_NODE);
console.log('Dialeto:', process.env.DB_DIALECT_NODE);

testarConexao();
