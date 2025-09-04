const {
  login,
  ensureAdminAndLogin,
  createPerson,
  createBusiness,
  createOwnedAccount,
  getPerson,
  deletePerson,
  getOwnedAccount,
} = require('../utils/apiClient');

const { uniqueEmail, expectOwnedAccount404 } = require('../utils/testHelpers');

describe('DELETE /persons/:id (ADMIN only + cascade accounts)', () => {
  let adminAccessToken;

  let personOwnerAccessToken;
  let personOwnerId;
  let personOwnedAccountIds = [];

  let otherPersonId;

  let businessOwnerAccessToken;
  let businessOwnerId;

  beforeEach(async () => {
    ({ token: adminAccessToken } = await ensureAdminAndLogin());

    // Cria um PERSON owner
    const personOwnerEmail = uniqueEmail('e2e.del.person.owner');
    const personOwnerResponse = await createPerson(null, { email: personOwnerEmail });
    personOwnerId = personOwnerResponse.body.id;

    const personOwnerLoginResponse = await login(personOwnerEmail, 'Strong@123');
    personOwnerAccessToken = personOwnerLoginResponse.accessToken;

    // Cria 2 contas para o PERSON owner
    const checkingAccountResponse = await createOwnedAccount(personOwnerId, adminAccessToken, { type: 'CHECKING' });
    const savingsAccountResponse = await createOwnedAccount(personOwnerId, adminAccessToken, { type: 'SAVINGS' });
    personOwnedAccountIds = [checkingAccountResponse.body.id, savingsAccountResponse.body.id].filter(Boolean);

    // Cria outro PERSON
    const otherPersonEmail = uniqueEmail('e2e.del.person.other');
    const otherPersonResponse = await createPerson(null, { email: otherPersonEmail });
    otherPersonId = otherPersonResponse.body.id;

    // Cria um BUSINESS (id errado para rota de persons)
    const businessOwnerEmail = uniqueEmail('e2e.del.biz.owner');
    const businessOwnerResponse = await createBusiness(null, { email: businessOwnerEmail });
    businessOwnerId = businessOwnerResponse.body.id;

    const businessOwnerLoginResponse = await login(businessOwnerEmail, 'Strong@123');
    businessOwnerAccessToken = businessOwnerLoginResponse.accessToken;
  });

  it('401 - nega sem token', async () => {
    await deletePerson(personOwnerId, null).expect(401);
  });

  it('401 - nega token inválido', async () => {
    await deletePerson(personOwnerId, 'invalid.token.value').expect(401);
  });

  it('403 - PERSON autenticado (não-admin) não pode deletar', async () => {
    await deletePerson(personOwnerId, personOwnerAccessToken).expect(403);
  });

  it('403 - BUSINESS autenticado (não-admin) não pode deletar', async () => {
    await deletePerson(personOwnerId, businessOwnerAccessToken).expect(403);
  });

  it('400 - ADMIN tenta deletar /persons/:id usando ID de BUSINESS', async () => {
    await deletePerson(businessOwnerId, adminAccessToken).expect(400);
  });

  it('404 - ADMIN deleta id inexistente', async () => {
    await deletePerson(99999999, adminAccessToken).expect(404);
  });

  it('200 - ADMIN deleta PERSON e remove contas (cascade → 404 nas contas)', async () => {
    await getPerson(personOwnerId, adminAccessToken).expect(200);

    await deletePerson(personOwnerId, adminAccessToken).expect(200);

    await getPerson(personOwnerId, adminAccessToken).expect(404);

    for (const accountId of personOwnedAccountIds) {
      await expectOwnedAccount404({ getOwnedAccount }, personOwnerId, accountId, adminAccessToken);
    }
  });

  it('404 - ADMIN tenta deletar novamente (2ª vez)', async () => {
    await deletePerson(otherPersonId, adminAccessToken).expect(200);
    await deletePerson(otherPersonId, adminAccessToken).expect(404);
  });
});
