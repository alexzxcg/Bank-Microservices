const request = require('supertest');
const app = require('../../../src/app');

const {
  login,
  ensureAdminAndLogin,
  createPerson,
  createBusiness,
} = require('../utils/apiClient');

const { uniqueEmail } = require('../utils/testHelpers');

describe('E2E: listagem global de persons/businesses (somente ADMIN)', () => {
  let adminAccessToken;
  let personAccessToken;
  let businessAccessToken;

  beforeEach(async () => {
    // Admin logado
    ({ token: adminAccessToken } = await ensureAdminAndLogin());

    // Seeds base para as listagens (criados via ADMIN)
    await createPerson(adminAccessToken);
    await createPerson(adminAccessToken);
    await createBusiness(adminAccessToken);

    // Cria um usuário PERSON e faz login próprio
    const personEmail = uniqueEmail('test.person');
    await createPerson(null, { email: personEmail });
    const personLoginResponse = await login(personEmail, 'Strong@123');
    personAccessToken = personLoginResponse.accessToken;

    // Cria um usuário BUSINESS e faz login próprio
    const businessEmail = uniqueEmail('test.biz');
    await createBusiness(null, { email: businessEmail });
    const businessLoginResponse = await login(businessEmail, 'Strong@123');
    businessAccessToken = businessLoginResponse.accessToken;
  });

  it('200 - ADMIN lista todos persons', async () => {
    const response = await request(app)
      .get('/persons')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
  });

  it('200 - ADMIN lista todos businesses', async () => {
    const response = await request(app)
      .get('/businesses')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });

  it('403 - PERSON não deve listar todos persons', async () => {
    const response = await request(app)
      .get('/persons')
      .set('Authorization', `Bearer ${personAccessToken}`);
    expect(response.status).toBe(403);
  });

  it('403 - PERSON não deve listar todos businesses', async () => {
    const response = await request(app)
      .get('/businesses')
      .set('Authorization', `Bearer ${personAccessToken}`);
    expect(response.status).toBe(403);
  });

  it('403 - BUSINESS não deve listar todos businesses', async () => {
    const response = await request(app)
      .get('/businesses')
      .set('Authorization', `Bearer ${businessAccessToken}`);
    expect(response.status).toBe(403);
  });

  it('403 - BUSINESS não deve listar todos persons', async () => {
    const response = await request(app)
      .get('/persons')
      .set('Authorization', `Bearer ${businessAccessToken}`);
    expect(response.status).toBe(403);
  });

  it('401 - nega sem token', async () => {
    await request(app).get('/persons').expect(401);
    await request(app).get('/businesses').expect(401);
  });
});
