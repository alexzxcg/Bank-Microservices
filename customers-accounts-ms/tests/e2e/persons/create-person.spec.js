const request = require('supertest');
const app = require('../../../src/app');
const { makePersonPayload } = require('../utils/factories');

describe('POST /persons', () => {
  describe('happy path', () => {
    it('201 cria uma pessoa e não vaza senha', async () => {
      const res = await request(app)
        .post('/persons')
        .send(makePersonPayload())
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('201 normaliza email/state', async () => {
      const res = await request(app).post('/persons').send(makePersonPayload());
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });
  });

  describe('validation', () => {
    it('400 cpf inválido', async () => {
      const res = await request(app)
        .post('/persons')
        .send(makePersonPayload({ cpf: '12345678901' }))
        .expect(400);

      expect(res.body).toHaveProperty('mensagem', 'Validation error');
      expect(res.body.detalhes.join(' ')).toMatch(/cpf/i);
    });

    it('400 quando falta email', async () => {
      const { email, ...payload } = makePersonPayload();
      const res = await request(app).post('/persons').send(payload);
      expect(res.status).toBe(400);
      expect(res.body.mensagem).toBe('Validation error');
    });

    it('400 type != PERSON', async () => {
      const res = await request(app)
        .post('/persons')
        .send(makePersonPayload({ type: 'BUSINESS' }))
        .expect(400);

      expect(res.body.detalhes.join(' ')).toMatch(/one of the following values: PERSON/i);
    });

    it('400 password curta', async () => {
      const res = await request(app)
        .post('/persons')
        .send(makePersonPayload({ password: '1234567' }))
        .expect(400);
    });

    it('400 cpf com 10 dígitos', async () => {
      const res = await request(app)
        .post('/persons')
        .send(makePersonPayload({ cpf: '1234567890' }))
        .expect(400);

      expect(res.body.detalhes.join(' ')).toMatch(/cpf must have 11 digits/i);
    });

    it('400 cpf sequência repetida', async () => {
      const res = await request(app)
        .post('/persons')
        .send(makePersonPayload({ cpf: '00000000000' }))
        .expect(400);
    });

    it('400 monthlyIncome não numérico', async () => {
      const res = await request(app)
        .post('/persons')
        .send(makePersonPayload({ monthlyIncome: 'abc' }))
        .expect(400);

      expect(res.body.detalhes.join(' ')).toMatch(/monthlyIncome must be number/i);
    });

    it('400 state > 2 chars', async () => {
      const res = await request(app)
        .post('/persons')
        .send(makePersonPayload({ state: 'SPO' }))
        .expect(400);
    });

    it('400 campo desconhecido', async () => {
      const payload = { ...makePersonPayload(), hacker: true };
      const res = await request(app).post('/persons').send(payload).expect(400);
      expect(res.body.detalhes.join(' ')).toMatch(/unknown fields/i);
    });
  });

  describe('persistence', () => {
    it('400 email duplicado', async () => {
      const payload = makePersonPayload();
      await request(app).post('/persons').send(payload).expect(201);

      const res2 = await request(app).post('/persons').send(payload).expect(400);
      expect(res2.body.mensagem).toBe('Error creating record');
    });
  });
});
