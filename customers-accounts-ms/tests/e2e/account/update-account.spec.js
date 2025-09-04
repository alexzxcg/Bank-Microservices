const {
  login,
  ensureAdminAndLogin,
  createPerson,
  createBusiness,
  createOwnedAccount,
  getOwnedAccount,
  updateOwnedAccount,
} = require('../utils/apiClient');
const { uniqueEmail } = require('../utils/testHelpers');
const request = require('supertest');
const app = require('../../../src/app');

describe('PUT /myAccounts/:myId/accounts/:accountId (update type only)', () => {
  describe('happy path', () => {
    it('200 - PERSON muda CHECKING -> SAVINGS (self) e mantém number/branch', async () => {
      const personEmail = uniqueEmail('upd.person.1');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const createdAccountResponse = await createOwnedAccount(personId, personToken, { type: 'CHECKING' });
      const accountId = createdAccountResponse.body.id;

      const beforeRead = await getOwnedAccount(personId, accountId, personToken).expect(200);
      const previousNumber = beforeRead.body.number;
      const previousBranch = beforeRead.body.branch;

      const updateResponse = await updateOwnedAccount(personId, accountId, personToken, { type: 'SAVINGS' }).expect(200);
      expect(updateResponse.body.id).toBe(accountId);
      if (updateResponse.body.type) expect(updateResponse.body.type).toBe('SAVINGS');

      const afterRead = await getOwnedAccount(personId, accountId, personToken).expect(200);
      if (previousNumber !== undefined) expect(afterRead.body.number).toBe(previousNumber);
      if (previousBranch !== undefined) expect(afterRead.body.branch).toBe(previousBranch);
      if (afterRead.body.type) expect(afterRead.body.type).toBe('SAVINGS');
      expect(afterRead.body).not.toHaveProperty('customerId');
    });

    it('200 - PERSON muda SAVINGS -> CHECKING (self)', async () => {
      const personEmail = uniqueEmail('upd.person.2');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const createdSavings = await createOwnedAccount(personId, personToken, { type: 'SAVINGS' });
      const accountId = createdSavings.body.id;

      const updateResponse = await updateOwnedAccount(personId, accountId, personToken, { type: 'CHECKING' }).expect(200);
      expect(updateResponse.body.id).toBe(accountId);
      if (updateResponse.body.type) expect(updateResponse.body.type).toBe('CHECKING');
    });

    it('200 - ADMIN atualiza conta de PERSON (3rd-party) CHECKING -> SAVINGS', async () => {
      const { token: adminToken } = await ensureAdminAndLogin();

      const targetPersonEmail = uniqueEmail('upd.admin.person');
      const createdTargetPerson = await createPerson(null, { email: targetPersonEmail, password: 'Strong@123' });
      const targetPersonId = createdTargetPerson.body.id;

      const createdTargetAccount = await createOwnedAccount(targetPersonId, adminToken, { type: 'CHECKING' });
      const targetAccountId = createdTargetAccount.body.id;

      const updateResponse = await updateOwnedAccount(targetPersonId, targetAccountId, adminToken, { type: 'SAVINGS' }).expect(200);
      expect(updateResponse.body.id).toBe(targetAccountId);
      if (updateResponse.body.type) expect(updateResponse.body.type).toBe('SAVINGS');
    });

    it('200 - idempotente: atualizar para o mesmo tipo retorna a própria conta (BUSINESS MERCHANT -> MERCHANT)', async () => {
      const { token: adminToken } = await ensureAdminAndLogin();

      const businessEmail = uniqueEmail('upd.biz.same');
      const createdBusiness = await createBusiness(null, { email: businessEmail, password: 'Strong@123' });
      const businessId = createdBusiness.body.id;

      const createdMerchant = await createOwnedAccount(businessId, adminToken, { type: 'MERCHANT' });
      const accountId = createdMerchant.body.id;

      const updateResponse = await updateOwnedAccount(businessId, accountId, adminToken, { type: 'MERCHANT' }).expect(200);
      expect(updateResponse.body.id).toBe(accountId);
      if (updateResponse.body.type) expect(updateResponse.body.type).toBe('MERCHANT');
    });

    it('200 - normaliza type (case-insensitive): checking -> CHECKING', async () => {
      const personEmail = uniqueEmail('upd.person.case');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const createdSavings = await createOwnedAccount(personId, personToken, { type: 'SAVINGS' });
      const accountId = createdSavings.body.id;

      const updateResponse = await updateOwnedAccount(personId, accountId, personToken, { type: 'checking' }).expect(200);
      expect(updateResponse.body.id).toBe(accountId);
      if (updateResponse.body.type) expect(updateResponse.body.type).toBe('CHECKING');
    });
  });

  describe('authN / authZ', () => {
    it('401 - sem token', async () => {
      const personEmail = uniqueEmail('upd.no.token');
      const createdPerson = await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const personId = createdPerson.body.id;

      const { token: adminToken } = await ensureAdminAndLogin();
      const createdAccount = await createOwnedAccount(personId, adminToken, { type: 'CHECKING' });
      const accountId = createdAccount.body.id;

      await updateOwnedAccount(personId, accountId, null, { type: 'SAVINGS' }).expect(401);
    });

    it('401 - token inválido/expirado', async () => {
      const { token: adminToken } = await ensureAdminAndLogin();

      const personEmail = uniqueEmail('upd.bad.token');
      const createdPerson = await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const personId = createdPerson.body.id;

      const createdAccount = await createOwnedAccount(personId, adminToken, { type: 'CHECKING' });
      const accountId = createdAccount.body.id;

      await request(app)
        .put(`/myAccounts/${personId}/accounts/${accountId}`)
        .set('Authorization', 'Bearer invalid.token.here')
        .send({ type: 'SAVINGS' })
        .expect(401);
    });

    it('403 - USER não pode atualizar conta de outro myId', async () => {
      const personAEmail = uniqueEmail('upd.user.A');
      const personBEmail = uniqueEmail('upd.user.B');
      await createPerson(null, { email: personAEmail, password: 'Strong@123' });
      await createPerson(null, { email: personBEmail, password: 'Strong@123' });

      const { accessToken: personAToken, user: personAUser } = await login(personAEmail, 'Strong@123');
      const { user: personBUser } = await login(personBEmail, 'Strong@123');

      const { token: adminToken } = await ensureAdminAndLogin();
      const createdAccountForB = await createOwnedAccount(personBUser.id, adminToken, { type: 'CHECKING' });
      const accountIdForB = createdAccountForB.body.id;

      // pessoa A tenta atualizar conta da pessoa B
      await updateOwnedAccount(personBUser.id, accountIdForB, personAToken, { type: 'SAVINGS' }).expect(403);
    });
  });

  describe('validation (schema / params / body)', () => {
    it('400 - body vazio (type obrigatório via schema)', async () => {
      const personEmail = uniqueEmail('upd.val.empty');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const createdAccount = await createOwnedAccount(personId, personToken, { type: 'CHECKING' });
      const accountId = createdAccount.body.id;

      const response = await updateOwnedAccount(personId, accountId, personToken, {}).expect(400);
      expect(response.body.mensagem).toBe('Validation error');
      expect((response.body.detalhes || []).join(' ')).toMatch(/type is required/i);
    });

    it('400 - type inválido (não listado)', async () => {
      const personEmail = uniqueEmail('upd.val.invalidType');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const createdAccount = await createOwnedAccount(personId, personToken, { type: 'CHECKING' });
      const accountId = createdAccount.body.id;

      const response = await updateOwnedAccount(personId, accountId, personToken, { type: 'PREMIUM' }).expect(400);
      expect(response.body.mensagem).toBe('Validation error');
      expect((response.body.detalhes || []).join(' ')).toMatch(/one of: CHECKING, SAVINGS, MERCHANT/i);
    });

    it('400 - campo desconhecido (noUnknown)', async () => {
      const personEmail = uniqueEmail('upd.val.unknown');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const createdAccount = await createOwnedAccount(personId, personToken, { type: 'SAVINGS' });
      const accountId = createdAccount.body.id;

      const response = await updateOwnedAccount(personId, accountId, personToken, { type: 'CHECKING', hacker: true }).expect(400);
      expect(response.body.mensagem).toBe('Validation error');
      expect((response.body.detalhes || []).join(' ')).toMatch(/unknown fields/i);
    });

    it('400 - myId do path não positivo / não inteiro', async () => {
      const personEmail = uniqueEmail('upd.val.myid');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const { accessToken: personToken } = await login(personEmail, 'Strong@123');

      await request(app)
        .put('/myAccounts/0/accounts/1')
        .set('Authorization', `Bearer ${personToken}`)
        .send({ type: 'CHECKING' })
        .expect(400);

      await request(app)
        .put('/myAccounts/abc/accounts/1')
        .set('Authorization', `Bearer ${personToken}`)
        .send({ type: 'CHECKING' })
        .expect(400);
    });

    it('400 - accountId do path não positivo / não inteiro', async () => {
      const personEmail = uniqueEmail('upd.val.accid');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');

      await request(app)
        .put(`/myAccounts/${personUser.id}/accounts/0`)
        .set('Authorization', `Bearer ${personToken}`)
        .send({ type: 'SAVINGS' })
        .expect(400);

      await request(app)
        .put(`/myAccounts/${personUser.id}/accounts/abc`)
        .set('Authorization', `Bearer ${personToken}`)
        .send({ type: 'SAVINGS' })
        .expect(400);
    });
  });

  describe('policies', () => {
    it('400 - PERSON não pode atualizar para MERCHANT', async () => {
      const personEmail = uniqueEmail('upd.pol.person2merchant');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const createdAccount = await createOwnedAccount(personId, personToken, { type: 'CHECKING' });
      const accountId = createdAccount.body.id;

      const response = await updateOwnedAccount(personId, accountId, personToken, { type: 'MERCHANT' }).expect(400);
      expect(response.body.mensagem).toMatch(/Customers of type PERSON can only create accounts/i);
    });

    it('400 - BUSINESS não pode atualizar para CHECKING/SAVINGS', async () => {
      const businessEmail = uniqueEmail('upd.pol.biz2others');
      await createBusiness(null, { email: businessEmail, password: 'Strong@123' });
      const { accessToken: businessToken, user: businessUser } = await login(businessEmail, 'Strong@123');
      const businessId = businessUser.id;

      const { token: adminToken } = await ensureAdminAndLogin();
      const createdMerchant = await createOwnedAccount(businessId, adminToken, { type: 'MERCHANT' });
      const accountId = createdMerchant.body.id;

      await updateOwnedAccount(businessId, accountId, businessToken, { type: 'CHECKING' }).expect(400);
      await updateOwnedAccount(businessId, accountId, businessToken, { type: 'SAVINGS' }).expect(400);
    });

    it('200 - ADMIN pode atualizar respeitando as regras do dono (PERSON: CHECKING<->SAVINGS; BUSINESS: MERCHANT apenas)', async () => {
      const { token: adminToken } = await ensureAdminAndLogin();

      // PERSON
      const adminTargetPersonEmail = uniqueEmail('upd.pol.admin.person');
      const createdAdminTargetPerson = await createPerson(null, { email: adminTargetPersonEmail, password: 'Strong@123' });
      const adminTargetPersonId = createdAdminTargetPerson.body.id;
      const createdPersonAccount = await createOwnedAccount(adminTargetPersonId, adminToken, { type: 'CHECKING' });
      const personAccountId = createdPersonAccount.body.id;
      await updateOwnedAccount(adminTargetPersonId, personAccountId, adminToken, { type: 'SAVINGS' }).expect(200);

      // BUSINESS
      const adminTargetBusinessEmail = uniqueEmail('upd.pol.admin.biz');
      const createdAdminTargetBusiness = await createBusiness(null, { email: adminTargetBusinessEmail, password: 'Strong@123' });
      const adminTargetBusinessId = createdAdminTargetBusiness.body.id;
      const createdBusinessAccount = await createOwnedAccount(adminTargetBusinessId, adminToken, { type: 'MERCHANT' });
      const businessAccountId = createdBusinessAccount.body.id;

      await updateOwnedAccount(adminTargetBusinessId, businessAccountId, adminToken, { type: 'MERCHANT' }).expect(200);
      await updateOwnedAccount(adminTargetBusinessId, businessAccountId, adminToken, { type: 'CHECKING' }).expect(400);
    });

    it('404 - USER tenta atualizar conta que não é sua (passa pelo authorize por ser self, mas repo devolve 404)', async () => {
      const { token: adminToken } = await ensureAdminAndLogin();

      const personEmailA = uniqueEmail('upd.404.A');
      const personEmailB = uniqueEmail('upd.404.B');
      const createdPersonA = await createPerson(null, { email: personEmailA, password: 'Strong@123' });
      const createdPersonB = await createPerson(null, { email: personEmailB, password: 'Strong@123' });
      const { accessToken: personAToken } = await login(personEmailA, 'Strong@123');

      // cria conta para B
      const createdAccountForB = await createOwnedAccount(createdPersonB.body.id, adminToken, { type: 'CHECKING' });

      // A tenta atualizar uma conta de B, usando seu próprio myId → repo retorna 404
      await updateOwnedAccount(createdPersonA.body.id, createdAccountForB.body.id, personAToken, { type: 'SAVINGS' }).expect(404);
    });

    it('404 - ADMIN atualiza accountId inexistente de um cliente válido', async () => {
      const { token: adminToken } = await ensureAdminAndLogin();
      const nonExistingAccountPersonEmail = uniqueEmail('upd.404.admin');
      const createdNonExistingAccountPerson = await createPerson(null, { email: nonExistingAccountPersonEmail, password: 'Strong@123' });
      const personId = createdNonExistingAccountPerson.body.id;

      await updateOwnedAccount(personId, 9_999_999, adminToken, { type: 'SAVINGS' }).expect(404);
    });
  });
});
