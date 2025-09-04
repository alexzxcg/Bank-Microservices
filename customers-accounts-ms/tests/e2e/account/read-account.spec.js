const {
  login,
  ensureAdminAndLogin,
  createPerson,
  createBusiness,
  createOwnedAccount,
  getOwnedAccount,
  listOwnedAccounts,
} = require('../utils/apiClient');

const { uniqueEmail, expectOwnedAccount404 } = require('../utils/testHelpers');

function digitsAccountNumber(value) {
  return /^\d{5}-\d$/.test(String(value || ''));
}

describe('GET /myAccounts/:myId/accounts & /myAccounts/:myId/accounts/:accountId', () => {
  // Happy paths
  it('200 - PERSON lista todas as próprias contas e lê por id', async () => {
    const personEmail = uniqueEmail('read.person');
    await createPerson(null, { email: personEmail, password: 'Strong@123' });
    const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
    const personId = personUser.id;

    const createdCheckingRes = await createOwnedAccount(personId, personToken, { type: 'CHECKING' });
    const createdSavingsRes  = await createOwnedAccount(personId, personToken, { type: 'SAVINGS' });

    const listRes = await listOwnedAccounts(personId, personToken).expect(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(2);

    const returnedIds = listRes.body.map(acc => acc.id);
    expect(returnedIds).toEqual(expect.arrayContaining([createdCheckingRes.body.id, createdSavingsRes.body.id]));

    const returnedTypes = listRes.body.map(acc => acc.type).filter(Boolean);
    expect(returnedTypes).toEqual(expect.arrayContaining(['CHECKING', 'SAVINGS']));

    // não vaza customerId
    listRes.body.forEach(acc => expect(acc).not.toHaveProperty('customerId'));

    // campos formais se expostos
    listRes.body.forEach(acc => {
      if (acc.branch) expect(acc.branch).toBe('4402');
      if (acc.number) expect(digitsAccountNumber(acc.number)).toBe(true);
      if (typeof acc.active !== 'undefined') expect(acc.active).toBe(true);
    });

    // detalhe de uma conta do dono
    const accountId = createdCheckingRes.body.id;
    const detailRes = await getOwnedAccount(personId, accountId, personToken).expect(200);
    expect(detailRes.body.id).toBe(accountId);
    if (detailRes.body.number) expect(digitsAccountNumber(detailRes.body.number)).toBe(true);
  });

  it('200 - BUSINESS lista as próprias contas (MERCHANT) e lê por id', async () => {
    const businessEmail = uniqueEmail('read.biz');
    await createBusiness(null, { email: businessEmail, password: 'Strong@123' });
    const { accessToken: businessToken, user: businessUser } = await login(businessEmail, 'Strong@123');
    const businessId = businessUser.id;

    const createdMerchant1 = await createOwnedAccount(businessId, businessToken, { type: 'MERCHANT' });
    const createdMerchant2 = await createOwnedAccount(businessId, businessToken, { type: 'MERCHANT' });

    const listRes = await listOwnedAccounts(businessId, businessToken).expect(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(2);
    listRes.body.forEach(acc => {
      if (acc.type) expect(acc.type).toBe('MERCHANT');
    });

    const accountId = createdMerchant2.body.id;
    const detailRes = await getOwnedAccount(businessId, accountId, businessToken).expect(200);
    expect(detailRes.body.id).toBe(accountId);
  });

  it('200 - ADMIN lista contas de um PERSON e lê por id', async () => {
    const { token: adminToken } = await ensureAdminAndLogin();

    const targetPersonEmail = uniqueEmail('read.admin.person');
    const createdPersonRes = await createPerson(null, { email: targetPersonEmail, password: 'Strong@123' });
    const targetPersonId = createdPersonRes.body.id;

    const createdAccountRes = await createOwnedAccount(targetPersonId, adminToken, { type: 'CHECKING' });

    const listRes = await listOwnedAccounts(targetPersonId, adminToken).expect(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(1);

    const detailRes = await getOwnedAccount(targetPersonId, createdAccountRes.body.id, adminToken).expect(200);
    expect(detailRes.body.id).toBe(createdAccountRes.body.id);
  });

  it('200 - ADMIN lista contas de um BUSINESS e lê por id', async () => {
    const { token: adminToken } = await ensureAdminAndLogin();

    const targetBusinessEmail = uniqueEmail('read.admin.biz');
    const createdBusinessRes = await createBusiness(null, { email: targetBusinessEmail, password: 'Strong@123' });
    const targetBusinessId = createdBusinessRes.body.id;

    const createdAccountRes = await createOwnedAccount(targetBusinessId, adminToken, { type: 'MERCHANT' });

    const listRes = await listOwnedAccounts(targetBusinessId, adminToken).expect(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(1);

    const detailRes = await getOwnedAccount(targetBusinessId, createdAccountRes.body.id, adminToken).expect(200);
    expect(detailRes.body.id).toBe(createdAccountRes.body.id);
  });

  it('200 - lista vazia quando o cliente não possui contas', async () => {
    const personEmail = uniqueEmail('read.empty');
    await createPerson(null, { email: personEmail, password: 'Strong@123' });
    const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');

    const listRes = await listOwnedAccounts(personUser.id, personToken).expect(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(0);
  });

  // AuthN/AuthZ
  it('401 - nega sem token (lista e detalhe)', async () => {
    const personEmail = uniqueEmail('read.unauth');
    const createdPersonRes = await createPerson(null, { email: personEmail, password: 'Strong@123' });
    const personId = createdPersonRes.body.id;

    // cria uma conta com admin só para ter um id
    const { token: adminToken } = await ensureAdminAndLogin();
    const createdAccountRes = await createOwnedAccount(personId, adminToken, { type: 'CHECKING' });

    await listOwnedAccounts(personId, null).expect(401);
    await getOwnedAccount(personId, createdAccountRes.body.id, null).expect(401);
  });

  it('401 - token inválido (lista e detalhe)', async () => {
    const personEmail = uniqueEmail('read.invalid');
    const createdPersonRes = await createPerson(null, { email: personEmail, password: 'Strong@123' });
    const personId = createdPersonRes.body.id;

    const { token: adminToken } = await ensureAdminAndLogin();
    const createdAccountRes = await createOwnedAccount(personId, adminToken, { type: 'CHECKING' });

    await listOwnedAccounts(personId, 'Bearer invalid.token.value').expect(401);
    await getOwnedAccount(personId, createdAccountRes.body.id, 'Bearer invalid.token.value').expect(401);
  });

  it('403 - USER não pode listar contas de outro myId', async () => {
    // Alice (dona) e Bob (tenta listar contas da Alice)
    const aliceEmail = uniqueEmail('read.alice');
    await createPerson(null, { email: aliceEmail, password: 'Strong@123' });
    const aliceLogin = await login(aliceEmail, 'Strong@123');
    const aliceId = aliceLogin.user.id;
    const aliceToken = aliceLogin.accessToken;

    const bobEmail = uniqueEmail('read.bob');
    await createPerson(null, { email: bobEmail, password: 'Strong@123' });
    const bobLogin = await login(bobEmail, 'Strong@123');
    const bobToken = bobLogin.accessToken;

    await createOwnedAccount(aliceId, aliceToken, { type: 'CHECKING' });

    await listOwnedAccounts(aliceId, bobToken).expect(403);
  });

  it('404 - USER autenticado tenta ler conta que não é sua (mesmo passando seu próprio myId)', async () => {
    // cria Alice com conta; Bob tenta acessar a conta da Alice usando myId = Bob (autz passa, repo retorna 404)
    const aliceEmail = uniqueEmail('read404.alice');
    await createPerson(null, { email: aliceEmail, password: 'Strong@123' });
    const aliceLogin = await login(aliceEmail, 'Strong@123');
    const aliceId = aliceLogin.user.id;
    const aliceToken = aliceLogin.accessToken;

    const aliceAccountRes = await createOwnedAccount(aliceId, aliceToken, { type: 'CHECKING' });

    const bobEmail = uniqueEmail('read404.bob');
    await createPerson(null, { email: bobEmail, password: 'Strong@123' });
    const bobLogin = await login(bobEmail, 'Strong@123');

    await expectOwnedAccount404(
      { getOwnedAccount },
      bobLogin.user.id,           // myId do Bob (autorização passa)
      aliceAccountRes.body.id,    // accountId da Alice
      bobLogin.accessToken
    );
  });

  // Validação de parâmetros
  it('400 - myId do path não positivo/inteiro na listagem', async () => {
    const personEmail = uniqueEmail('read.invalid.myid');
    await createPerson(null, { email: personEmail, password: 'Strong@123' });
    const { accessToken: personToken } = await login(personEmail, 'Strong@123');

    const respZero = await listOwnedAccounts(0, personToken).expect(400);
    expect((respZero.body.detalhes || []).join(' ')).toMatch(/myId must be a positive integer/i);

    const respNonInteger = await listOwnedAccounts('abc', personToken).expect(400);
    expect((respNonInteger.body.detalhes || []).join(' ')).toMatch(/myId must be a positive integer/i);
  });

  it('400 - accountId do path não positivo/inteiro no detalhe', async () => {
    const personEmail = uniqueEmail('read.invalid.accid');
    await createPerson(null, { email: personEmail, password: 'Strong@123' });
    const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');

    const respZero = await getOwnedAccount(personUser.id, 0, personToken).expect(400);
    expect((respZero.body.detalhes || []).join(' ')).toMatch(/accountId must be a positive integer/i);

    const respNonInteger = await getOwnedAccount(personUser.id, 'abc', personToken).expect(400);
    expect((respNonInteger.body.detalhes || []).join(' ')).toMatch(/accountId must be a positive integer/i);
  });
});