const request = require('supertest');
const app = require('../../../src/app');

const {
  login,
  ensureAdminAndLogin,
  createPerson,
  createBusiness,
  postOwnedAccount,
  getOwnedAccount,
} = require('../utils/apiClient');

const {
  uniqueEmail,
  expectIfPresent,
  expectOwnedAccount404,
} = require('../utils/testHelpers');

function digitsAccountNumber(value) {
  return /^\d{5}-\d$/.test(String(value || ''));
}

describe('POST /myAccounts/:myId/accounts', () => {
  describe('happy path', () => {
    it('201 - PERSON cria CHECKING (self)', async () => {
      const personEmail = uniqueEmail('person');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });

      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const createRes = await postOwnedAccount(personId, personToken, { type: 'CHECKING' }).expect(201);
      expect(createRes.body).toHaveProperty('id');
      expectIfPresent(createRes.body, 'type', 'CHECKING');
      if (createRes.body.branch) expect(createRes.body.branch).toBe('4402');

      const createdAccountId = createRes.body.id;
      const readRes = await getOwnedAccount(personId, createdAccountId, personToken).expect(200);
      if (readRes.body.number) expect(digitsAccountNumber(readRes.body.number)).toBe(true);
      if (readRes.body.branch) expect(readRes.body.branch).toBe('4402');
      if (readRes.body.type) expect(readRes.body.type).toBe('CHECKING');
    });

    it('201 - PERSON cria SAVINGS (self)', async () => {
      const personEmail = uniqueEmail('person');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });

      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const createRes = await postOwnedAccount(personId, personToken, { type: 'SAVINGS' }).expect(201);
      expect(createRes.body).toHaveProperty('id');
      expectIfPresent(createRes.body, 'type', 'SAVINGS');
      if (createRes.body.branch) expect(createRes.body.branch).toBe('4402');

      const readRes = await getOwnedAccount(personId, createRes.body.id, personToken).expect(200);
      if (readRes.body.number) expect(digitsAccountNumber(readRes.body.number)).toBe(true);
    });

    it('201 - BUSINESS cria MERCHANT (self)', async () => {
      const businessEmail = uniqueEmail('biz');
      await createBusiness(null, { email: businessEmail, password: 'Strong@123' });

      const { accessToken: businessToken, user: businessUser } = await login(businessEmail, 'Strong@123');
      const businessId = businessUser.id;

      const createRes = await postOwnedAccount(businessId, businessToken, { type: 'MERCHANT' }).expect(201);
      expect(createRes.body).toHaveProperty('id');
      expectIfPresent(createRes.body, 'type', 'MERCHANT');
      if (createRes.body.branch) expect(createRes.body.branch).toBe('4402');

      const readRes = await getOwnedAccount(businessId, createRes.body.id, businessToken).expect(200);
      if (readRes.body.number) expect(digitsAccountNumber(readRes.body.number)).toBe(true);
    });

    it('201 - Admin cria conta para um PERSON (3rd-party)', async () => {
      const { token: adminToken } = await ensureAdminAndLogin();

      const targetPersonEmail = uniqueEmail('person');
      const createdPersonRes = await createPerson(null, { email: targetPersonEmail, password: 'Strong@123' });
      const targetPersonId = createdPersonRes.body.id;

      const createRes = await postOwnedAccount(targetPersonId, adminToken, { type: 'CHECKING' }).expect(201);
      expect(createRes.body).toHaveProperty('id');
      if (createRes.body.type) expect(createRes.body.type).toBe('CHECKING');
    });

    it('201 - Admin cria conta para um BUSINESS (3rd-party)', async () => {
      const { token: adminToken } = await ensureAdminAndLogin();

      const targetBusinessEmail = uniqueEmail('biz');
      const createdBusinessRes = await createBusiness(null, { email: targetBusinessEmail, password: 'Strong@123' });
      const targetBusinessId = createdBusinessRes.body.id;

      const createRes = await postOwnedAccount(targetBusinessId, adminToken, { type: 'MERCHANT' }).expect(201);
      expect(createRes.body).toHaveProperty('id');
      if (createRes.body.type) expect(createRes.body.type).toBe('MERCHANT');
    });

    it('201 - normaliza type (case-insensitive)', async () => {
      const personEmail = uniqueEmail('person');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });

      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const createRes = await postOwnedAccount(personId, personToken, { type: 'checking' }).expect(201);
      expect(createRes.body).toHaveProperty('id');

      const readRes = await getOwnedAccount(personId, createRes.body.id, personToken).expect(200);
      if (readRes.body.type) expect(readRes.body.type).toBe('CHECKING');
    });

    it('201 - múltiplas contas permitidas (CHECKING e SAVINGS para PERSON)', async () => {
      const personEmail = uniqueEmail('person');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });

      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const createdChecking = await postOwnedAccount(personId, personToken, { type: 'CHECKING' }).expect(201);
      const createdSavings  = await postOwnedAccount(personId, personToken, { type: 'SAVINGS' }).expect(201);

      const readChecking = await getOwnedAccount(personId, createdChecking.body.id, personToken).expect(200);
      const readSavings  = await getOwnedAccount(personId, createdSavings.body.id, personToken).expect(200);

      if (readChecking.body.number) expect(digitsAccountNumber(readChecking.body.number)).toBe(true);
      if (readSavings.body.number) expect(digitsAccountNumber(readSavings.body.number)).toBe(true);
      if (readChecking.body.number && readSavings.body.number) {
        expect(readChecking.body.number).not.toBe(readSavings.body.number);
      }
    });
  });

  describe('validação (schema / params / body)', () => {
    it('401 - sem token', async () => {
      const personEmail = uniqueEmail('person');
      const createdPersonRes = await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const personId = createdPersonRes.body.id;

      await request(app)
        .post(`/myAccounts/${personId}/accounts`)
        .send({ type: 'CHECKING' })
        .expect(401);
    });

    it('401 - token inválido/expirado', async () => {
      const personEmail = uniqueEmail('person');
      const createdPersonRes = await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const personId = createdPersonRes.body.id;

      await request(app)
        .post(`/myAccounts/${personId}/accounts`)
        .set('Authorization', 'Bearer invalid.token.here')
        .send({ type: 'CHECKING' })
        .expect(401);
    });

    it('400 - type ausente', async () => {
      const personEmail = uniqueEmail('person');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });

      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const res = await postOwnedAccount(personId, personToken, {}).expect(400);
      expect(res.body.mensagem).toBe('Validation error');
      expect((res.body.detalhes || []).join(' ')).toMatch(/Account type is required/i);
    });

    it('400 - type inválido (não listado)', async () => {
      const personEmail = uniqueEmail('person');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });

      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const res = await postOwnedAccount(personId, personToken, { type: 'PREMIUM' }).expect(400);
      expect(res.body.mensagem).toBe('Validation error');
      expect((res.body.detalhes || []).join(' ')).toMatch(/one of: CHECKING, SAVINGS, MERCHANT/i);
    });

    it('400 - campo desconhecido (noUnknown)', async () => {
      const personEmail = uniqueEmail('person');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });

      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const res = await postOwnedAccount(personId, personToken, { type: 'CHECKING', hacker: true }).expect(400);
      expect(res.body.mensagem).toBe('Validation error');
      expect((res.body.detalhes || []).join(' ')).toMatch(/unknown fields/i);
    });

    it('400 - myId do path não positivo (0)', async () => {
      const personEmail = uniqueEmail('person');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });

      const { accessToken: personToken } = await login(personEmail, 'Strong@123');

      const res = await request(app)
        .post('/myAccounts/0/accounts')
        .set('Authorization', `Bearer ${personToken}`)
        .send({ type: 'CHECKING' })
        .expect(400);
      expect((res.body.detalhes || []).join(' ')).toMatch(/myId must be a positive integer/i);
    });

    it('400 - myId do path não inteiro (abc)', async () => {
      const personEmail = uniqueEmail('person');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });

      const { accessToken: personToken } = await login(personEmail, 'Strong@123');

      const res = await request(app)
        .post('/myAccounts/abc/accounts')
        .set('Authorization', `Bearer ${personToken}`)
        .send({ type: 'CHECKING' })
        .expect(400);
      expect((res.body.detalhes || []).join(' ')).toMatch(/myId must be a positive integer/i);
    });
  });

  describe('autorização & policies', () => {
    it('403 - usuário não-admin tentando criar para outro myId', async () => {
      const requesterEmail = uniqueEmail('personA');
      const targetEmail = uniqueEmail('personB');
      await createPerson(null, { email: requesterEmail, password: 'Strong@123' });
      const createdTarget = await createPerson(null, { email: targetEmail, password: 'Strong@123' });

      const { accessToken: requesterToken } = await login(requesterEmail, 'Strong@123');
      const targetId = createdTarget.body.id;

      const res = await postOwnedAccount(targetId, requesterToken, { type: 'CHECKING' }).expect(403);
      expect(res.body.mensagem).toMatch(/Forbidden/i);
    });

    it('422 - ADMIN não pode criar para si mesmo', async () => {
      const { token: adminToken, user: adminUser } = await ensureAdminAndLogin();
      const adminId = adminUser.id;

      const res = await postOwnedAccount(adminId, adminToken, { type: 'MERCHANT' }).expect(422);
      expect(res.body.mensagem).toMatch(/Admins cannot have accounts/i);
    });

    it('400 - PERSON tentando criar MERCHANT', async () => {
      const personEmail = uniqueEmail('person');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });

      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const res = await postOwnedAccount(personId, personToken, { type: 'MERCHANT' }).expect(400);
      expect(res.body.mensagem).toMatch(/Customers of type PERSON can only create accounts/i);
    });

    it('400 - BUSINESS tentando criar CHECKING', async () => {
      const businessEmail = uniqueEmail('biz');
      await createBusiness(null, { email: businessEmail, password: 'Strong@123' });

      const { accessToken: businessToken, user: businessUser } = await login(businessEmail, 'Strong@123');
      const businessId = businessUser.id;

      const res = await postOwnedAccount(businessId, businessToken, { type: 'CHECKING' }).expect(400);
      expect(res.body.mensagem).toMatch(/Customers of type BUSINESS can only create accounts/i);
    });

    it('400 - BUSINESS tentando criar SAVINGS', async () => {
      const businessEmail = uniqueEmail('biz');
      await createBusiness(null, { email: businessEmail, password: 'Strong@123' });

      const { accessToken: businessToken, user: businessUser } = await login(businessEmail, 'Strong@123');
      const businessId = businessUser.id;

      const res = await postOwnedAccount(businessId, businessToken, { type: 'SAVINGS' }).expect(400);
      expect(res.body.mensagem).toMatch(/Customers of type BUSINESS can only create accounts/i);
    });
  });

  describe('regras de preenchimento/imutabilidade', () => {
    it('201 - branch default 4402 e number no formato 12345-6 (se expostos)', async () => {
      const personEmail = uniqueEmail('person');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });

      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const createRes = await postOwnedAccount(personId, personToken, { type: 'CHECKING' }).expect(201);
      expect(createRes.body).toHaveProperty('id');
      if (createRes.body.branch) expect(createRes.body.branch).toBe('4402');

      const readRes = await getOwnedAccount(personId, createRes.body.id, personToken).expect(200);
      if (readRes.body.number) expect(digitsAccountNumber(readRes.body.number)).toBe(true);
    });

    it('400 - enviar campos proibidos (number/branch/balance/active) deve falhar por noUnknown', async () => {
      const personEmail = uniqueEmail('person');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });

      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const res = await postOwnedAccount(personId, personToken, {
        type: 'CHECKING',
        number: '12345-6',
        branch: '0001',
        balance: 999,
        active: true,
      }).expect(400);

      expect(res.body.mensagem).toBe('Validation error');
      expect((res.body.detalhes || []).join(' ')).toMatch(/unknown fields/i);
    });
  });

  describe('persistência/consistência', () => {
    it('201 - conta pertence ao myId: GET próprio funciona; GET de outro dono 404', async () => {
      const ownerEmail = uniqueEmail('person');
      await createPerson(null, { email: ownerEmail, password: 'Strong@123' });

      const { accessToken: ownerToken, user: ownerUser } = await login(ownerEmail, 'Strong@123');
      const ownerId = ownerUser.id;

      const createRes = await postOwnedAccount(ownerId, ownerToken, { type: 'CHECKING' }).expect(201);
      const createdAccountId = createRes.body.id;

      await getOwnedAccount(ownerId, createdAccountId, ownerToken).expect(200);

      const otherEmail = uniqueEmail('person');
      await createPerson(null, { email: otherEmail, password: 'Strong@123' });
      const { accessToken: otherToken, user: otherUser } = await login(otherEmail, 'Strong@123');

      await expectOwnedAccount404({ getOwnedAccount }, otherUser.id, createdAccountId, otherToken);
    });

    it('201 - números gerados distintos para contas diferentes do mesmo usuário (verificando via GET)', async () => {
      const personEmail = uniqueEmail('person');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });

      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const createdChecking = await postOwnedAccount(personId, personToken, { type: 'CHECKING' }).expect(201);
      const createdSavings  = await postOwnedAccount(personId, personToken, { type: 'SAVINGS' }).expect(201);

      const readChecking = await getOwnedAccount(personId, createdChecking.body.id, personToken).expect(200);
      const readSavings  = await getOwnedAccount(personId, createdSavings.body.id, personToken).expect(200);

      if (readChecking.body.number) expect(digitsAccountNumber(readChecking.body.number)).toBe(true);
      if (readSavings.body.number) expect(digitsAccountNumber(readSavings.body.number)).toBe(true);
      if (readChecking.body.number && readSavings.body.number) {
        expect(readChecking.body.number).not.toBe(readSavings.body.number);
      }
    });
  });
});