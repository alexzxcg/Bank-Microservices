const { Customer } = require('../../../src/models');
const { generateCNPJ } = require('./generateCNPJ');
const { generateCPF } = require('./generateCPF');
const { hashPassword } = require('../../../src/utils/password');


async function createAdminIfMissing({ email, password }) {
  const normalized = email.toLowerCase();
  const exists = await Customer.findOne({ where: { email: normalized } });
  if (!exists) {
    const passwordHash = await hashPassword(password);
    await Customer.create({
      type: 'ADMIN',
      name: 'System Admin',
      email: normalized,
      passwordHash,
    });
  }
}

function makePersonPayload(overrides = {}) {
  return {
    type: 'PERSON',
    name: 'Ana Souza',
    email: `person.${Date.now()}@example.com`, 
    password: 'Strong@123',
    cpf: generateCPF(),                       
    monthlyIncome: 6500,
    birthDate: '1992-03-10',
    phone: '+55 11 99999-1111',
    street: 'Rua A',
    number: '100',
    district: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
    ...overrides,
  };
}

function makeBusinessPayload(overrides = {}) {
  return {
    type: 'BUSINESS',
    name: 'Aurora Tech LTDA',
    email: `corp.${Date.now()}@biz.com`, 
    password: 'Strong@123',
    cnpj: generateCNPJ(),                  
    isIcmsExempt: true,
    stateRegistration: null,
    street: 'Rua da Quitanda',
    number: '120',
    district: 'Centro',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '20011-030',
    ...overrides,
  };
}

module.exports = { makeBusinessPayload, makePersonPayload, createAdminIfMissing };
