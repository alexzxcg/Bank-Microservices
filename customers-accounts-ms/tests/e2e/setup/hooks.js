const { sequelize } = require('../../../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  const tables = Object.keys(sequelize.models);
  for (const name of tables) {
    await sequelize.models[name].destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
  }
});

afterAll(async () => {
  await sequelize.close();
});
