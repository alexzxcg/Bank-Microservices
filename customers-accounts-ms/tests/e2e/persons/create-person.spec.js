const request = require('supertest');
const app = require('../../../src/app');
const { makePersonPayload } = require('../utils/factories');
const { createPerson } = require('../utils/apiClient');
const { uniqueEmail } = require('../utils/testHelpers');

describe('POST /persons', () => {
  describe('happy path', () => {
    it('201 - cria uma pessoa e não vaza senha/hash', async () => {
      const personPayload = makePersonPayload({ email: uniqueEmail('e2e.person.create') });
      const response = await createPerson(null, personPayload);

      expect(response.body).toHaveProperty('id');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('resetToken');
    });

    it('201 - normaliza email/state (smoke: retorna id)', async () => {
      const response = await request(app)
        .post('/persons')
        .send(makePersonPayload({ email: 'User.CASE@Example.COM', state: 'sp' }))
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('validation', () => {
    it('400 - cpf inválido', async () => {
      const response = await request(app)
        .post('/persons')
        .send(makePersonPayload({ cpf: '12345678901' }))
        .expect(400);

      expect(response.body).toHaveProperty('mensagem', 'Validation error');
      expect(response.body.detalhes.join(' ')).toMatch(/cpf/i);
    });

    it('400 - falta email', async () => {
      const { email, ...payloadWithoutEmail } = makePersonPayload();
      const response = await request(app).post('/persons').send(payloadWithoutEmail).expect(400);
      expect(response.body.mensagem).toBe('Validation error');
    });

    it('400 - type != PERSON', async () => {
      const response = await request(app)
        .post('/persons')
        .send(makePersonPayload({ type: 'BUSINESS' }))
        .expect(400);

      expect(response.body.detalhes.join(' ')).toMatch(/one of the following values: PERSON/i);
    });

    it('400 - password curta', async () => {
      await request(app)
        .post('/persons')
        .send(makePersonPayload({ password: '1234567' }))
        .expect(400);
    });

    it('400 - cpf com 10 dígitos', async () => {
      const response = await request(app)
        .post('/persons')
        .send(makePersonPayload({ cpf: '1234567890' }))
        .expect(400);

      expect(response.body.detalhes.join(' ')).toMatch(/cpf must have 11 digits/i);
    });

    it('400 - cpf sequência repetida', async () => {
      await request(app)
        .post('/persons')
        .send(makePersonPayload({ cpf: '00000000000' }))
        .expect(400);
    });

    it('400 - monthlyIncome não numérico', async () => {
      const response = await request(app)
        .post('/persons')
        .send(makePersonPayload({ monthlyIncome: 'abc' }))
        .expect(400);

      expect(response.body.detalhes.join(' ')).toMatch(/monthlyIncome must be number/i);
    });

    it('400 - state com mais de 2 caracteres', async () => {
      await request(app)
        .post('/persons')
        .send(makePersonPayload({ state: 'SPO' }))
        .expect(400);
    });

    it('400 - campo desconhecido', async () => {
      const invalidPayload = { ...makePersonPayload(), hacker: true };
      const response = await request(app).post('/persons').send(invalidPayload).expect(400);
      expect(response.body.detalhes.join(' ')).toMatch(/unknown fields/i);
    });
  });

  describe('persistence', () => {
    it('400 - email duplicado', async () => {
      const duplicatedEmailPayload = makePersonPayload({ email: uniqueEmail('e2e.person.dup') });

      // cria primeiro (201) usando helper
      await createPerson(null, duplicatedEmailPayload);

      // tenta criar novamente com o mesmo email → 400
      const secondResponse = await request(app).post('/persons').send(duplicatedEmailPayload).expect(400);
      expect(secondResponse.body.mensagem).toBe('Error creating record');
    });
  });
});
