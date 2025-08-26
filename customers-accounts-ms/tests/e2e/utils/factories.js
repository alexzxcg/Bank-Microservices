function makePersonPayload(overrides = {}) {
  return {
    type: "PERSON",
    name: "Ana Souza",
    email: "ana.souza@example.com",
    password: "Strong@123",
    cpf: "52998224725",
    monthlyIncome: 6500,
    birthDate: "1992-03-10",
    phone: "+55 11 99999-1111",
    street: "Rua A",
    number: "100",
    district: "Centro",
    city: "São Paulo",
    state: "SP",
    zipCode: "01000-000",
    ...overrides
  };
}

module.exports = { makePersonPayload };
