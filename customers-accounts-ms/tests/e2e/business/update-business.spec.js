const {
  login,
  ensureAdminAndLogin,
  createPerson,
  createBusiness,
  updateBusiness,
} = require('../utils/apiClient');

const { uniqueEmail, expectIfPresent } = require('../utils/testHelpers');

describe('PUT /businesses/:id (auth + validation + domain rules + ICMS)', () => {
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

  // AuthN/Z
  it('401 - nega sem token', async () => {
    await updateBusiness(businessOwnerId, null, { name: 'Nova LTDA' }).expect(401);
  });

  it('401 - nega token inválido/expirado', async () => {
    await updateBusiness(businessOwnerId, 'invalid.token.value', { name: 'Nova LTDA' }).expect(401);
  });

  it('403 - usuário autenticado NÃO pode atualizar outro business', async () => {
    await updateBusiness(otherBusinessId, businessOwnerAccessToken, {}).expect(403);
  });

  it('200 - owner atualiza o próprio business (payload válido)', async () => {
    const validUpdatePayload = { name: 'Aurora Tech Atualizada', phone: '+55 21 90000-0001' };
    const response = await updateBusiness(businessOwnerId, businessOwnerAccessToken, validUpdatePayload).expect(200);
    expect(response.body.id).toBe(businessOwnerId);
    expect(response.body.type).toBe('BUSINESS');
    expectIfPresent(response.body, 'name', validUpdatePayload.name);
    expectIfPresent(response.body, 'phone', validUpdatePayload.phone);
  });

  it('200 - ADMIN atualiza qualquer business (payload válido)', async () => {
    const adminUpdatePayload = { state: 'RJ', city: 'Rio de Janeiro' };
    const response = await updateBusiness(otherBusinessId, adminAccessToken, adminUpdatePayload).expect(200);
    expect(response.body.id).toBe(otherBusinessId);
    expectIfPresent(response.body, 'state', 'RJ');
    expectIfPresent(response.body, 'city', 'Rio de Janeiro');
  });

  it('400 - usar ID de PERSON em /businesses/:id', async () => {
    await updateBusiness(personId, adminAccessToken, { name: 'NaoImporta' }).expect(400);
  });

  it('400 - PERSON atualizando /businesses/:personId', async () => {
    await updateBusiness(personId, personAccessToken, { name: 'NaoImporta' }).expect(400);
  });

  // Validação
  it('400 - body vazio → at least one field must be provided (owner)', async () => {
    await updateBusiness(businessOwnerId, businessOwnerAccessToken, {}).expect(400);
  });

  it('400 - campo desconhecido (noUnknown) → ex: { foo: "bar" }', async () => {
    await updateBusiness(businessOwnerId, businessOwnerAccessToken, { foo: 'bar' }).expect(400);
  });

  it('400 - birthDate inválida', async () => {
    await updateBusiness(businessOwnerId, businessOwnerAccessToken, { birthDate: '31-31-9999' }).expect(400);
  });

  it('400 - state com mais de 2 caracteres', async () => {
    await updateBusiness(businessOwnerId, businessOwnerAccessToken, { state: 'RJO' }).expect(400);
  });

  it('200 - aceita nulos onde permitido (nullable)', async () => {
    const response = await updateBusiness(businessOwnerId, businessOwnerAccessToken, { phone: null, birthDate: null }).expect(200);
    expect(response.body.id).toBe(businessOwnerId);
    expectIfPresent(response.body, 'phone', null);
    expectIfPresent(response.body, 'birthDate', null);
  });

  // ICMS rules
  it('400 - isIcmsExempt = false SEM stateRegistration', async () => {
    await updateBusiness(businessOwnerId, businessOwnerAccessToken, { isIcmsExempt: false }).expect(400);
  });

  it('200 - isIcmsExempt = false COM stateRegistration', async () => {
    const response = await updateBusiness(businessOwnerId, businessOwnerAccessToken, { isIcmsExempt: false, stateRegistration: 'ISENTO-123456' }).expect(200);
    expectIfPresent(response.body, 'isIcmsExempt', false);
    expectIfPresent(response.body, 'stateRegistration', 'ISENTO-123456');
  });

  it('200 - isIcmsExempt = true e stateRegistration = null', async () => {
    await updateBusiness(businessOwnerId, businessOwnerAccessToken, { isIcmsExempt: false, stateRegistration: 'IE-999' }).expect(200);
    const response = await updateBusiness(businessOwnerId, businessOwnerAccessToken, { isIcmsExempt: true, stateRegistration: null }).expect(200);
    expectIfPresent(response.body, 'isIcmsExempt', true);
    expectIfPresent(response.body, 'stateRegistration', null);
  });

  // Campos proibidos
  it('400 - enviar cnpj (removido do schema) → unknown field', async () => {
    await updateBusiness(businessOwnerId, businessOwnerAccessToken, { cnpj: '11222333000181' }).expect(400);
  });

  it('400 - enviar email (removido do schema) → unknown field', async () => {
    await updateBusiness(businessOwnerId, businessOwnerAccessToken, { email: 'nova@corp.com' }).expect(400);
  });

  it('400 - rejeitar type/password/passwordHash/resetToken', async () => {
    await updateBusiness(businessOwnerId, businessOwnerAccessToken, {
      type: 'ADMIN',
      password: 'H4ck@123',
      passwordHash: 'hash',
      resetToken: 'token',
    }).expect(400);
  });

  // Integridade
  it('404 - ADMIN atualizando id inexistente', async () => {
    await updateBusiness(9_999_999, adminAccessToken, { name: 'Não Importa' }).expect(404);
  });

  it('200 - ADMIN atualiza múltiplos campos de uma vez', async () => {
    const bulkUpdatePayload = { name: 'Empresa Admin Edit', phone: '+55 21 93333-2222', state: 'RJ', city: 'Niterói', birthDate: null };
    const response = await updateBusiness(otherBusinessId, adminAccessToken, bulkUpdatePayload).expect(200);
    expect(response.body.id).toBe(otherBusinessId);
    expectIfPresent(response.body, 'name', bulkUpdatePayload.name);
    expectIfPresent(response.body, 'phone', bulkUpdatePayload.phone);
    expectIfPresent(response.body, 'state', 'RJ');
    expectIfPresent(response.body, 'city', 'Niterói');
    expectIfPresent(response.body, 'birthDate', null);
  });
});
