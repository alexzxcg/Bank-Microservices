const {
  login,
  ensureAdminAndLogin,
  createPerson,
  createBusiness,
  updatePerson,
  getPerson,
} = require('../utils/apiClient');
const { uniqueEmail, expectIfPresent } = require('../utils/testHelpers');
const request = require('supertest');
const app = require('../../../src/app');

describe('PUT /persons/:id (auth + validation + domain rules)', () => {
  let adminAccessToken;

  let personOwnerAccessToken;
  let personOwnerId;

  let otherPersonId;

  let businessOwnerAccessToken;
  let businessOwnerId;

  beforeEach(async () => {
    ({ token: adminAccessToken } = await ensureAdminAndLogin());

    const personOwnerEmail = uniqueEmail('e2e.person.owner');
    const personOwnerResponse = await createPerson(null, { email: personOwnerEmail });
    personOwnerId = personOwnerResponse.body.id;

    const personOwnerLoginResponse = await login(personOwnerEmail, 'Strong@123');
    personOwnerAccessToken = personOwnerLoginResponse.accessToken;

    const otherPersonEmail = uniqueEmail('e2e.person.other');
    const otherPersonResponse = await createPerson(null, { email: otherPersonEmail });
    otherPersonId = otherPersonResponse.body.id;

    const businessOwnerEmail = uniqueEmail('e2e.biz');
    const businessOwnerResponse = await createBusiness(null, { email: businessOwnerEmail });
    businessOwnerId = businessOwnerResponse.body.id;

    const businessOwnerLoginResponse = await login(businessOwnerEmail, 'Strong@123');
    businessOwnerAccessToken = businessOwnerLoginResponse.accessToken;
  });

  it('401 - nega sem token', async () => {
    await updatePerson(personOwnerId, null, { name: 'Novo Nome' }).expect(401);
  });

  it('401 - nega token inválido/expirado', async () => {
    await request(app)
      .put(`/persons/${personOwnerId}`)
      .set('Authorization', 'Bearer invalid.token.value')
      .send({ name: 'Novo Nome' })
      .expect(401);
  });

  it('403 - usuário autenticado NÃO pode atualizar outro id (mesmo com body inválido → curto-circuito)', async () => {
    await updatePerson(otherPersonId, personOwnerAccessToken, {}).expect(403);
  });

  it('200 - owner atualiza o próprio registro (payload válido - name/phone)', async () => {
    const ownerValidUpdatePayload = { name: 'Ana Souza Atualizada', phone: '+55 11 90000-0001' };
    const response = await updatePerson(personOwnerId, personOwnerAccessToken, ownerValidUpdatePayload).expect(200);

    expect(response.body).toBeTruthy();
    expect(response.body.id).toBe(personOwnerId);
    expect(response.body.type).toBe('PERSON');
    expectIfPresent(response.body, 'name', ownerValidUpdatePayload.name);
    expectIfPresent(response.body, 'phone', ownerValidUpdatePayload.phone);
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body).not.toHaveProperty('resetToken');
  });

  it('200 - ADMIN atualiza qualquer pessoa (payload válido - name/state)', async () => {
    const adminValidUpdatePayload = { name: 'Edit by Admin', state: 'SP' };
    const response = await updatePerson(otherPersonId, adminAccessToken, adminValidUpdatePayload).expect(200);

    expect(response.body).toBeTruthy();
    expect(response.body.id).toBe(otherPersonId);
    expect(response.body.type).toBe('PERSON');
    expectIfPresent(response.body, 'name', adminValidUpdatePayload.name);
    expectIfPresent(response.body, 'state', 'SP');
  });

  it('400 - ADMIN (ou owner) tenta atualizar /persons/:id com ID de BUSINESS → tipo errado', async () => {
    await updatePerson(businessOwnerId, adminAccessToken, { name: 'NaoImporta' }).expect(400);
  });

  it('400 - USER BUSINESS tentando atualizar /persons/:businessId (autorização por id passa, repo barra por tipo)', async () => {
    await updatePerson(businessOwnerId, businessOwnerAccessToken, { name: 'NaoImporta' }).expect(400);
  });

  // Validação
  it('400 - body vazio → at least one field must be provided (owner)', async () => {
    await updatePerson(personOwnerId, personOwnerAccessToken, {}).expect(400);
  });

  it('400 - campo desconhecido (noUnknown) → ex: { foo: "bar" }', async () => {
    await updatePerson(personOwnerId, personOwnerAccessToken, { foo: 'bar' }).expect(400);
  });

  it('400 - monthlyIncome negativo', async () => {
    await updatePerson(personOwnerId, personOwnerAccessToken, { monthlyIncome: -100 }).expect(400);
  });

  it('400 - monthlyIncome não numérico', async () => {
    await updatePerson(personOwnerId, personOwnerAccessToken, { monthlyIncome: 'abc' }).expect(400);
  });

  it('400 - birthDate inválida', async () => {
    await updatePerson(personOwnerId, personOwnerAccessToken, { birthDate: '31-31-9999' }).expect(400);
  });

  it('400 - state com mais de 2 caracteres', async () => {
    await updatePerson(personOwnerId, personOwnerAccessToken, { state: 'SPO' }).expect(400);
  });

  it('200 - aceita nulos onde permitido (nullable)', async () => {
    const response = await updatePerson(personOwnerId, personOwnerAccessToken, { phone: null, birthDate: null }).expect(200);

    expect(response.body).toBeTruthy();
    expect(response.body.id).toBe(personOwnerId);
    expectIfPresent(response.body, 'phone', null);
    expectIfPresent(response.body, 'birthDate', null);
  });

  it('400 - tentar enviar cpf (campo removido do schema) → unknown field', async () => {
    await updatePerson(personOwnerId, personOwnerAccessToken, { cpf: '12345678901' }).expect(400);
  });

  it('400 - tentar enviar email (campo removido do schema) → unknown field', async () => {
    await updatePerson(personOwnerId, personOwnerAccessToken, { email: 'novo.email@example.com' }).expect(400);
  });

  it('400 - rejeitar campos proibidos (type/password/passwordHash/resetToken)', async () => {
    await updatePerson(personOwnerId, personOwnerAccessToken, {
      type: 'ADMIN',
      password: 'H4ck@123',
      passwordHash: 'abc',
      resetToken: 'xyz',
    }).expect(400);
  });

  it('200 - atualização parcial mantém demais campos (compara um campo antes/depois)', async () => {
    const beforeResponse = await getPerson(personOwnerId, personOwnerAccessToken).expect(200);
    const beforeMonthlyIncome = beforeResponse.body.monthlyIncome;

    const updateResponse = await updatePerson(personOwnerId, personOwnerAccessToken, { phone: '+55 11 95555-4444' }).expect(200);
    expectIfPresent(updateResponse.body, 'phone', '+55 11 95555-4444');

    const afterResponse = await getPerson(personOwnerId, personOwnerAccessToken).expect(200);
    if (beforeMonthlyIncome !== undefined) {
      expect(afterResponse.body.monthlyIncome).toBe(beforeMonthlyIncome);
    }
  });

  it('200 - resposta não contém campos sensíveis', async () => {
    const response = await updatePerson(personOwnerId, personOwnerAccessToken, { name: 'Sem Campos Sensíveis' }).expect(200);

    expect(response.body).toBeTruthy();
    expect(response.body.id).toBe(personOwnerId);
    expect(response.body.type).toBe('PERSON');
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body).not.toHaveProperty('resetToken');
  });

  it('404 - ADMIN atualizando id inexistente', async () => {
    const nonExistingPersonId = 9_999_999;
    await updatePerson(nonExistingPersonId, adminAccessToken, { name: 'Não Importa' }).expect(404);
  });

  it('200 - ADMIN atualiza múltiplos campos de uma vez', async () => {
    const adminBulkUpdatePayload = {
      name: 'Pessoa Admin Edit',
      phone: '+55 11 93333-2222',
      state: 'SP',
      birthDate: null,
      monthlyIncome: 9999.9,
    };

    const response = await updatePerson(otherPersonId, adminAccessToken, adminBulkUpdatePayload).expect(200);

    expect(response.body).toBeTruthy();
    expect(response.body.id).toBe(otherPersonId);
    expect(response.body.type).toBe('PERSON');
    expectIfPresent(response.body, 'name', adminBulkUpdatePayload.name);
    expectIfPresent(response.body, 'phone', adminBulkUpdatePayload.phone);
    expectIfPresent(response.body, 'state', 'SP');
    expectIfPresent(response.body, 'birthDate', null);
    if (Object.prototype.hasOwnProperty.call(response.body, 'monthlyIncome')) {
      expect(response.body.monthlyIncome).toBeCloseTo(9999.9);
    }
  });
});
