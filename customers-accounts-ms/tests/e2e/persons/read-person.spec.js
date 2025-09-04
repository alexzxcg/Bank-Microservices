const {
  login,
  ensureAdminAndLogin,
  createPerson,
  createBusiness,
  getPerson,
} = require('../utils/apiClient');

const { uniqueEmail } = require('../utils/testHelpers');
const request = require('supertest');
const app = require('../../../src/app');

describe('GET /persons/:id (auth + RBAC)', () => {
  let adminAccessToken;

  let personOwnerAccessToken;
  let personOwnerId;

  let otherPersonId;

  let businessOwnerAccessToken;
  let businessOwnerId;

  beforeEach(async () => {
    ({ token: adminAccessToken } = await ensureAdminAndLogin());

    // Cria PERSON owner
    const personOwnerEmail = uniqueEmail('e2e.owner');
    const personOwnerResponse = await createPerson(null, { email: personOwnerEmail });
    personOwnerId = personOwnerResponse.body.id;

    const personOwnerLoginResponse = await login(personOwnerEmail, 'Strong@123');
    personOwnerAccessToken = personOwnerLoginResponse.accessToken;

    // Cria outro PERSON
    const otherPersonEmail = uniqueEmail('e2e.other');
    const otherPersonResponse = await createPerson(null, { email: otherPersonEmail });
    otherPersonId = otherPersonResponse.body.id;

    // Cria BUSINESS
    const businessOwnerEmail = uniqueEmail('e2e.biz');
    const businessOwnerResponse = await createBusiness(null, { email: businessOwnerEmail });
    businessOwnerId = businessOwnerResponse.body.id;

    const businessOwnerLoginResponse = await login(businessOwnerEmail, 'Strong@123');
    businessOwnerAccessToken = businessOwnerLoginResponse.accessToken;
  });

  it('401 - nega sem token', async () => {
    await getPerson(personOwnerId, null).expect(401);
  });

  it('401 - nega token inválido', async () => {
    await request(app)
      .get(`/persons/${personOwnerId}`)
      .set('Authorization', 'Bearer invalid.token.value')
      .expect(401);
  });

  it('200 - PERSON vê os próprios dados', async () => {
    const response = await getPerson(personOwnerId, personOwnerAccessToken).expect(200);
    expect(response.body.id).toBe(personOwnerId);
    expect(response.body.type).toBe('PERSON');
  });

  it('403 - PERSON não vê dados de outro cliente', async () => {
    await getPerson(otherPersonId, personOwnerAccessToken).expect(403);
  });

  it('200 - ADMIN vê qualquer PERSON', async () => {
    const response = await getPerson(otherPersonId, adminAccessToken).expect(200);
    expect(response.body.id).toBe(otherPersonId);
    expect(response.body.type).toBe('PERSON');
  });

  it('400 - usar ID de BUSINESS em /persons/:id', async () => {
    await getPerson(businessOwnerId, adminAccessToken).expect(400);
  });

  it('400 - BUSINESS tentando acessar /persons/:businessId', async () => {
    await getPerson(businessOwnerId, businessOwnerAccessToken).expect(400);
  });

  it('404 - ADMIN acessa id inexistente', async () => {
    await getPerson(9_999_999, adminAccessToken).expect(404);
  });

  it('403/404 - PERSON acessa id inexistente', async () => {
    const nonExistingPersonId = personOwnerId + 12345;
    const response = await getPerson(nonExistingPersonId, personOwnerAccessToken);
    expect([403, 404]).toContain(response.status);
  });
});
