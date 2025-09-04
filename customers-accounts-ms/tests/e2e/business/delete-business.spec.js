const {
  login,
  ensureAdminAndLogin,
  createPerson,
  createBusiness,
  createOwnedAccount,
  getBusiness,
  deleteBusiness,
  getOwnedAccount,
} = require('../utils/apiClient');

const { uniqueEmail, expectOwnedAccount404 } = require('../utils/testHelpers');

describe('DELETE /businesses/:id (ADMIN only + cascade accounts)', () => {
  let adminAccessToken;

  let businessOwnerAccessToken;
  let businessOwnerId;
  let businessAccountIds = [];
  let otherBusinessId;

  let personOwnerAccessToken;
  let personOwnerId;

  beforeEach(async () => {
    ({ token: adminAccessToken } = await ensureAdminAndLogin());

    // Cria um BUSINESS owner
    const businessOwnerEmail = uniqueEmail('e2e.del.biz.owner');
    const businessOwnerResponse = await createBusiness(null, { email: businessOwnerEmail });
    businessOwnerId = businessOwnerResponse.body.id;

    // Faz login do BUSINESS owner e obtém accessToken
    const businessOwnerLoginResponse = await login(businessOwnerEmail, 'Strong@123');
    businessOwnerAccessToken = businessOwnerLoginResponse.accessToken;

    // Cria contas MERCHANT para o BUSINESS owner
    const merchantAccount1 = await createOwnedAccount(businessOwnerId, adminAccessToken, { type: 'MERCHANT' });
    const merchantAccount2 = await createOwnedAccount(businessOwnerId, adminAccessToken, { type: 'MERCHANT' });
    businessAccountIds = [merchantAccount1.body.id, merchantAccount2.body.id].filter(Boolean);

    // Cria outro BUSINESS
    const otherBusinessEmail = uniqueEmail('e2e.del.biz.other');
    const otherBusinessResponse = await createBusiness(null, { email: otherBusinessEmail });
    otherBusinessId = otherBusinessResponse.body.id;

    // Cria um PERSON owner
    const personOwnerEmail = uniqueEmail('e2e.del.person');
    const personOwnerResponse = await createPerson(null, { email: personOwnerEmail });
    personOwnerId = personOwnerResponse.body.id;

    // Faz login do PERSON owner
    const personOwnerLoginResponse = await login(personOwnerEmail, 'Strong@123');
    personOwnerAccessToken = personOwnerLoginResponse.accessToken;
  });

  // AuthN/AuthZ
  it('401 - nega sem token', async () => {
    await deleteBusiness(businessOwnerId, null).expect(401);
  });

  it('401 - nega token inválido', async () => {
    // passa apenas o token inválido (sem "Bearer "), o helper adiciona o prefixo
    await deleteBusiness(businessOwnerId, 'invalid.token.value').expect(401);
  });

  it('403 - BUSINESS autenticado (não-admin) não pode deletar', async () => {
    await deleteBusiness(businessOwnerId, businessOwnerAccessToken).expect(403);
  });

  it('403 - PERSON autenticado (não-admin) não pode deletar', async () => {
    await deleteBusiness(businessOwnerId, personOwnerAccessToken).expect(403);
  });

  it('400 - ADMIN tenta deletar /businesses/:id usando ID de PERSON → tipo errado', async () => {
    await deleteBusiness(personOwnerId, adminAccessToken).expect(400);
  });

  it('404 - ADMIN deleta id inexistente', async () => {
    await deleteBusiness(99999999, adminAccessToken).expect(404);
  });

  // Sucesso + Cascade
  it('200 - ADMIN deleta BUSINESS e remove contas (cascade → 404 nas contas)', async () => {
    await getBusiness(businessOwnerId, adminAccessToken).expect(200);

    await deleteBusiness(businessOwnerId, adminAccessToken).expect(200);

    await getBusiness(businessOwnerId, adminAccessToken).expect(404);

    for (const accountId of businessAccountIds) {
      await expectOwnedAccount404({ getOwnedAccount }, businessOwnerId, accountId, adminAccessToken);
    }
  });

  it('404 - ADMIN tenta deletar novamente (2ª vez)', async () => {
    await deleteBusiness(otherBusinessId, adminAccessToken).expect(200);
    await deleteBusiness(otherBusinessId, adminAccessToken).expect(404);
  });
});
