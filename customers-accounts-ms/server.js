const app = require('./src/app.js');
const { sequelize } = require('./src/models'); 

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`Servidor escutando na porta ${PORT}!`);
    });
  } catch (err) {
    console.error('Erro ao iniciar servidor:', err);
  }
})();
