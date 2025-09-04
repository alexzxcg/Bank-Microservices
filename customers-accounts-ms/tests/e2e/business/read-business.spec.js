const {
  login,
  ensureAdminAndLogin,
  createPerson,
  createBusiness,
  getBusiness,
} = require('../utils/apiClient');

const { uniqueEmail } = require('../utils/testHelpers');

describe('GET /businesses/:id (auth + RBAC)', () => {
  let adminAccessToken;

  let businessOwnerAccessToken;
  let businessOwnerId;

  let otherBusinessId;

  let personAccessToken;
  let personId;

  beforeEach(async () => {
    ({ token: adminAccessToken } = await ensureAdminAndLogin());

    // Cria um BUSINESS owner
    const businessOwnerEmail = uniqueEmail('e2e.biz.owner');
    const businessOwnerResponse = await createBusiness(null, { email: businessOwnerEmail });
    businessOwnerId = businessOwnerResponse.body.id;

    const businessOwnerLoginResponse = await login(businessOwnerEmail, 'Strong@123');
    businessOwnerAccessToken = businessOwnerLoginResponse.accessToken;

    // Cria outro BUSINESS
    const otherBusinessEmail = uniqueEmail('e2e.biz.other');
    const otherBusinessResponse = await createBusiness(null, { email: otherBusinessEmail });
    otherBusinessId = otherBusinessResponse.body.id;

    // Cria um PERSON
    const personEmail = uniqueEmail('e2e.person');
    const personResponse = await createPerson(null, { email: personEmail });
    personId = personResponse.body.id;

    const personLoginResponse = await login(personEmail, 'Strong@123');
    personAccessToken = personLoginResponse.accessToken;
  });

  it('401 - nega sem token', async () => {
    await getBusiness(businessOwnerId, null).expect(401);
  });

  it('401 - nega token inválido', async () => {
    await getBusiness(businessOwnerId, 'invalid.token.value').expect(401);
  });

  it('200 - BUSINESS vê os PRÓPRIOS dados', async () => {
    const response = await getBusiness(businessOwnerId, businessOwnerAccessToken).expect(200);
    expect(response.body.id).toBe(businessOwnerId);
    expect(response.body.type).toBe('BUSINESS');
  });

  it('403 - BUSINESS não vê dados de OUTRO business', async () => {
    await getBusiness(otherBusinessId, businessOwnerAccessToken).expect(403);
  });

  it('200 - ADMIN vê qualquer BUSINESS', async () => {
    const response = await getBusiness(otherBusinessId, adminAccessToken).expect(200);
    expect(response.body.id).toBe(otherBusinessId);
    expect(response.body.type).toBe('BUSINESS');
  });

  it('400 - usar ID de PERSON em /businesses/:id', async () => {
    await getBusiness(personId, adminAccessToken).expect(400);
  });

  it('400 - PERSON tentando acessar /businesses/:personId', async () => {
    await getBusiness(personId, personAccessToken).expect(400);
  });

  it('404 - ADMIN acessa id inexistente', async () => {
    await getBusiness(9_999_999, adminAccessToken).expect(404);
  });

  it('403/404 - BUSINESS acessa id inexistente (autz deve barrar)', async () => {
    const nonExistingBusinessId = businessOwnerId + 12345;
    const response = await getBusiness(nonExistingBusinessId, businessOwnerAccessToken);
    expect([403, 404]).toContain(response.status);
  });
});
