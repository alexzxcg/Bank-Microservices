const request = require('supertest');
const app = require('../../../src/app');

const {
  login,
  ensureAdminAndLogin,
  createPerson,
  createBusiness,
  createOwnedAccount,
  getOwnedAccount,
  deleteOwnedAccount,
} = require('../utils/apiClient');

const { uniqueEmail } = require('../utils/testHelpers');

describe('DELETE /myAccounts/:myId/accounts/:accountId (soft delete -> active=false)', () => {
  describe('happy path', () => {
    it('200 - PERSON desativa a própria conta (active=false e permanece legível)', async () => {
      const personEmail = uniqueEmail('del.person.self');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const { accessToken: personToken, user: personUser } = await login(personEmail, 'Strong@123');
      const personId = personUser.id;

      const createdAccountRes = await createOwnedAccount(personId, personToken, { type: 'CHECKING' });
      const accountId = createdAccountRes.body.id;

      // desativa
      await deleteOwnedAccount(personId, accountId, personToken).expect(200);

      const readAfterDeleteRes = await getOwnedAccount(personId, accountId, personToken).expect(200);
      expect(readAfterDeleteRes.body.id).toBe(accountId);
      if (typeof readAfterDeleteRes.body.active !== 'undefined') {
        expect(readAfterDeleteRes.body.active).toBe(false);
      }
    });

    it('200 - ADMIN desativa conta de PERSON e BUSINESS', async () => {
      const { token: adminToken } = await ensureAdminAndLogin();

      // PERSON
      const targetPersonEmail = uniqueEmail('del.admin.person');
      const createdPersonRes = await createPerson(null, { email: targetPersonEmail, password: 'Strong@123' });
      const targetPersonId = createdPersonRes.body.id;
      const createdPersonAccountRes = await createOwnedAccount(targetPersonId, adminToken, { type: 'SAVINGS' });
      const targetPersonAccountId = createdPersonAccountRes.body.id;

      await deleteOwnedAccount(targetPersonId, targetPersonAccountId, adminToken).expect(200);
      const readPersonAcc = await getOwnedAccount(targetPersonId, targetPersonAccountId, adminToken).expect(200);
      if (typeof readPersonAcc.body.active !== 'undefined') {
        expect(readPersonAcc.body.active).toBe(false);
      }

      // BUSINESS
      const businessOwnerEmail = uniqueEmail('del.admin.business');
      const createdBusinessRes = await createBusiness(null, { email: businessOwnerEmail, password: 'Strong@123' });
      const businessOwnerId = createdBusinessRes.body.id;
      const createdBusinessAccountRes = await createOwnedAccount(businessOwnerId, adminToken, { type: 'MERCHANT' });
      const businessAccountId = createdBusinessAccountRes.body.id;

      await deleteOwnedAccount(businessOwnerId, businessAccountId, adminToken).expect(200);
      const readBusinessAcc = await getOwnedAccount(businessOwnerId, businessAccountId, adminToken).expect(200);
      if (typeof readBusinessAcc.body.active !== 'undefined') {
        expect(readBusinessAcc.body.active).toBe(false);
      }
    });

    it('404 - segunda tentativa de desativação retorna 404 (idempotente)', async () => {
      const { token: adminToken } = await ensureAdminAndLogin();

      const personEmail = uniqueEmail('del.twice.person');
      const createdPersonRes = await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const personId = createdPersonRes.body.id;
      const createdAccountRes = await createOwnedAccount(personId, adminToken, { type: 'CHECKING' });
      const accountId = createdAccountRes.body.id;

      await deleteOwnedAccount(personId, accountId, adminToken).expect(200);
      await deleteOwnedAccount(personId, accountId, adminToken).expect(404);
    });
  });

  describe('authN / authZ', () => {
    it('401 - sem token', async () => {
      const personEmail = uniqueEmail('del.no.token');
      const createdPersonRes = await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const personId = createdPersonRes.body.id;

      const { token: adminToken } = await ensureAdminAndLogin();
      const createdAccountRes = await createOwnedAccount(personId, adminToken, { type: 'CHECKING' });
      const accountId = createdAccountRes.body.id;

      await deleteOwnedAccount(personId, accountId, null).expect(401);
    });

    it('401 - token inválido/expirado', async () => {
      const { token: adminToken } = await ensureAdminAndLogin();

      const personEmail = uniqueEmail('del.bad.token');
      const createdPersonRes = await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const personId = createdPersonRes.body.id;
      const createdAccountRes = await createOwnedAccount(personId, adminToken, { type: 'SAVINGS' });
      const accountId = createdAccountRes.body.id;

      await request(app)
        .delete(`/myAccounts/${personId}/accounts/${accountId}`)
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('403 - USER não pode desativar conta de outro myId', async () => {
      // Usuário A e Usuário B
      const emailAlice = uniqueEmail('del.user.alice');
      const emailBob = uniqueEmail('del.user.bob');
      await createPerson(null, { email: emailAlice, password: 'Strong@123' });
      await createPerson(null, { email: emailBob, password: 'Strong@123' });

      const { accessToken: tokenAlice, user: userAlice } = await login(emailAlice, 'Strong@123');
      const { user: userBob } = await login(emailBob, 'Strong@123');

      const { token: adminToken } = await ensureAdminAndLogin();
      const createdBobAccountRes = await createOwnedAccount(userBob.id, adminToken, { type: 'CHECKING' });
      const bobAccountId = createdBobAccountRes.body.id;

      // Alice tenta deletar conta de Bob
      await deleteOwnedAccount(userBob.id, bobAccountId, tokenAlice).expect(403);
    });

    it('404 - USER tenta desativar conta que não é sua usando o próprio myId (passa authorize, repo devolve 404)', async () => {
      const { token: adminToken } = await ensureAdminAndLogin();

      const ownerEmail = uniqueEmail('del.owner');
      const otherEmail = uniqueEmail('del.other');
      const createdOwnerRes = await createPerson(null, { email: ownerEmail, password: 'Strong@123' });
      const createdOtherRes = await createPerson(null, { email: otherEmail, password: 'Strong@123' });

      const ownerId = createdOwnerRes.body.id;
      const otherId = createdOtherRes.body.id;

      const { accessToken: ownerToken } = await login(ownerEmail, 'Strong@123');

      const createdOtherAccountRes = await createOwnedAccount(otherId, adminToken, { type: 'SAVINGS' });
      const otherAccountId = createdOtherAccountRes.body.id;

      // Owner tenta deletar conta do Other, mas passando seu próprio myId
      await deleteOwnedAccount(ownerId, otherAccountId, ownerToken).expect(404);
    });
  });

  describe('validação (schema/params)', () => {
    it('400 - myId do path não positivo/inteiro', async () => {
      const personEmail = uniqueEmail('del.val.myid');
      await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const { accessToken: personToken } = await login(personEmail, 'Strong@123');

      await request(app)
        .delete('/myAccounts/0/accounts/1')
        .set('Authorization', `Bearer ${personToken}`)
        .expect(400);

      await request(app)
        .delete('/myAccounts/abc/accounts/1')
        .set('Authorization', `Bearer ${personToken}`)
        .expect(400);
    });

    it('400 - accountId do path não positivo/inteiro', async () => {
      const personEmail = uniqueEmail('del.val.accid');
      const createdPersonRes = await createPerson(null, { email: personEmail, password: 'Strong@123' });
      const personId = createdPersonRes.body.id;
      const { accessToken: personToken } = await login(personEmail, 'Strong@123');

      await request(app)
        .delete(`/myAccounts/${personId}/accounts/0`)
        .set('Authorization', `Bearer ${personToken}`)
        .expect(400);

      await request(app)
        .delete(`/myAccounts/${personId}/accounts/abc`)
        .set('Authorization', `Bearer ${personToken}`)
        .expect(400);
    });
  });
});