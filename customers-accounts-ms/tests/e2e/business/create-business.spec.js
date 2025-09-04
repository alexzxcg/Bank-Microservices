const request = require('supertest');
const app = require('../../../src/app');
const { makeBusinessPayload } = require('../utils/factories');
const { login } = require('../utils/apiClient');

function extractDigitsOnly(value) {
  return value == null ? value : String(value).replace(/\D+/g, '');
}

describe('POST /businesses', () => {
  describe('happy path', () => {
    it('201 - cria um business (retorna apenas id)', async () => {
      const response = await request(app).post('/businesses').send(makeBusinessPayload()).expect(201);
      expect(response.body).toHaveProperty('id');
    });

    it('201 - normaliza email/state (via GET autenticado)', async () => {
      const businessPayload = makeBusinessPayload({ email: 'MiXeD.Email+alias@Example.COM ', state: 'rj' });
      const creationResponse = await request(app).post('/businesses').send(businessPayload).expect(201);
      const createdBusinessId = creationResponse.body.id;

      const { accessToken: adminAccessToken } = await login(businessPayload.email, 'Strong@123');
      const fetchResponse = await request(app)
        .get(`/businesses/${createdBusinessId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      if (fetchResponse.body.email) expect(fetchResponse.body.email).toBe(businessPayload.email.trim().toLowerCase());
      if (fetchResponse.body.state) expect(fetchResponse.body.state).toBe('RJ');
    });

    it('201 - ICMS isento (isIcmsExempt=true) com stateRegistration=null', async () => {
      const exemptPayload = makeBusinessPayload({ isIcmsExempt: true, stateRegistration: null });
      const response = await request(app).post('/businesses').send(exemptPayload).expect(201);
      expect(response.body).toHaveProperty('id');
    });

    it('201 - ICMS não isento (isIcmsExempt=false) com stateRegistration presente', async () => {
      const notExemptPayload = makeBusinessPayload({ isIcmsExempt: false, stateRegistration: 'IE-123456' });
      const response = await request(app).post('/businesses').send(notExemptPayload).expect(201);
      expect(response.body).toHaveProperty('id');
    });

    it('201 - aceita CNPJ formatado e normaliza para dígitos (se o DTO expuser cnpj)', async () => {
      const formattedCNPJ = '11.222.333/0001-81';
      const cnpjPayload = makeBusinessPayload({ cnpj: formattedCNPJ, email: `formatted.${Date.now()}@biz.com` });

      const creationResponse = await request(app).post('/businesses').send(cnpjPayload).expect(201);
      const createdBusinessId = creationResponse.body.id;

      const { accessToken: adminAccessToken } = await login(cnpjPayload.email, 'Strong@123');
      const fetchResponse = await request(app)
        .get(`/businesses/${createdBusinessId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      if (fetchResponse.body.cnpj) expect(fetchResponse.body.cnpj).toBe(extractDigitsOnly(formattedCNPJ));
    });
  });

  describe('ICMS validation', () => {
    it('400 - isIcmsExempt=false e SEM stateRegistration', async () => {
      const { stateRegistration, ...invalidPayload } = makeBusinessPayload({ isIcmsExempt: false, stateRegistration: undefined });
      const response = await request(app).post('/businesses').send(invalidPayload).expect(400);
      expect(response.body.mensagem).toBe('Validation error');
      expect((response.body.detalhes || []).join(' ')).toMatch(/stateRegistration is required/i);
    });

    it('201 - isIcmsExempt=true e stateRegistration=null', async () => {
      const exemptPayload = makeBusinessPayload({ isIcmsExempt: true, stateRegistration: null });
      const response = await request(app).post('/businesses').send(exemptPayload).expect(201);
      expect(response.body).toHaveProperty('id');
    });
  });

  describe('validation', () => {
    it('400 - CNPJ len ≠ 14', async () => {
      const response = await request(app).post('/businesses').send(makeBusinessPayload({ cnpj: '1234567890123' })).expect(400);
      expect(response.body.mensagem).toBe('Validation error');
      expect((response.body.detalhes || []).join(' ')).toMatch(/CNPJ must have 14 digits/i);
    });

    it('400 - CNPJ sequência repetida', async () => {
      const response = await request(app).post('/businesses').send(makeBusinessPayload({ cnpj: '00000000000000' })).expect(400);
      expect(response.body.mensagem).toBe('Validation error');
      expect((response.body.detalhes || []).join(' ')).toMatch(/cannot be a repeated sequence/i);
    });

    it('400 - CNPJ com dígitos verificadores inválidos', async () => {
      const response = await request(app).post('/businesses').send(makeBusinessPayload({ cnpj: '11222333000180' })).expect(400);
      expect(response.body.mensagem).toBe('Validation error');
      expect((response.body.detalhes || []).join(' ')).toMatch(/Invalid CNPJ/i);
    });

    it('400 - falta email', async () => {
      const { email, ...payloadWithoutEmail } = makeBusinessPayload();
      const response = await request(app).post('/businesses').send(payloadWithoutEmail).expect(400);
      expect(response.body.mensagem).toBe('Validation error');
      expect((response.body.detalhes || []).join(' ')).toMatch(/email is required/i);
    });

    it('400 - type != BUSINESS', async () => {
      const response = await request(app).post('/businesses').send(makeBusinessPayload({ type: 'PERSON' })).expect(400);
      expect(response.body.mensagem).toBe('Validation error');
      expect((response.body.detalhes || []).join(' ')).toMatch(/type must be BUSINESS|one of/i);
    });

    it('400 - password curta', async () => {
      const response = await request(app).post('/businesses').send(makeBusinessPayload({ password: '1234567' })).expect(400);
      expect(response.body.mensagem).toBe('Validation error');
      expect((response.body.detalhes || []).join(' ')).toMatch(/at least 8 characters/i);
    });

    it('400 - state > 2 chars', async () => {
      const response = await request(app).post('/businesses').send(makeBusinessPayload({ state: 'RJO' })).expect(400);
      expect(response.body.mensagem).toBe('Validation error');
      expect((response.body.detalhes || []).join(' ')).toMatch(/state must have max 2 chars/i);
    });

    it('400 - campo desconhecido (noUnknown)', async () => {
      const invalidPayload = { ...makeBusinessPayload(), hacker: true };
      const response = await request(app).post('/businesses').send(invalidPayload).expect(400);
      expect(response.body.mensagem).toBe('Validation error');
      expect((response.body.detalhes || []).join(' ')).toMatch(/unknown fields/i);
    });
  });

  describe('persistence', () => {
    it('400 - email duplicado', async () => {
      const duplicateEmailPayload = makeBusinessPayload();
      await request(app).post('/businesses').send(duplicateEmailPayload).expect(201);
      const secondResponse = await request(app).post('/businesses').send(duplicateEmailPayload).expect(400);
      expect(secondResponse.body.mensagem).toBe('Error creating record');
    });

    it('400 - cnpj duplicado (com outro email)', async () => {
      const firstBusinessPayload = makeBusinessPayload();
      await request(app).post('/businesses').send(firstBusinessPayload).expect(201);

      const secondBusinessPayload = makeBusinessPayload({ cnpj: firstBusinessPayload.cnpj, email: `other.${Date.now()}@biz.com` });
      const secondResponse = await request(app).post('/businesses').send(secondBusinessPayload).expect(400);
      expect(secondResponse.body.mensagem).toBe('Error creating record');
    });
  });
});
