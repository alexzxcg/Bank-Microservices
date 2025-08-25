const request = require('supertest');
const app = require('../../../src/app');

describe('POST /persons', () => {
  it('cria uma pessoa com sucesso (201)', async () => {
    const payload = {
      type: "PERSON",
      name: "Ana Souza",
      email: "ana.souza@example.com",
      password: "Strong@123",
      cpf: "52998224725",
      monthlyIncome: 6500.00,
      birthDate: "1992-03-10",
      phone: "+55 11 99999-1111",
      street: "Rua A",
      number: "100",
      district: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01000-000"
    };

    const res = await request(app)
      .post('/persons')
      .send(payload)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('falha com CPF inválido (400)', async () => {
    const payload = {
      type: "PERSON",
      name: "João Teste",
      email: "joao@example.com",
      password: "Abc@123456",
      cpf: "12345678901",
      monthlyIncome: 5000,
      birthDate: "1990-01-01",
      phone: "+55 11 98888-7777",
      street: "Rua B",
      number: "200",
      district: "Bairro",
      city: "Curitiba",
      state: "PR",
      zipCode: "80000-000"
    };

    const res = await request(app)
      .post('/persons')
      .send(payload)
      .expect(400);

    expect(res.body).toHaveProperty('mensagem', 'Validation error');
    expect(res.body.detalhes.join(' ')).toMatch(/cpf/i);
  });
});
