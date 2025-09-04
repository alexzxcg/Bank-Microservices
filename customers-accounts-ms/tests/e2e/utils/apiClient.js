const request = require('supertest');
const app = require('../../../src/app');
const { makePersonPayload, makeBusinessPayload, createAdminIfMissing } = require('../utils/factories');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function login(email, password) {
  const res = await request(app)
    .post('/auth/login')
    .send({ email: String(email).trim().toLowerCase(), password })
    .expect(200);
  return res.body;
}

async function ensureAdminAndLogin() {
  await createAdminIfMissing({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  const loginRes = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  return {
    token: loginRes.accessToken, 
    user: loginRes.user,
    login: loginRes,
  };
}

// PERSON
async function createPerson(token, overrides = {}) {
  const payload = makePersonPayload(overrides);
  const res = await request(app).post('/persons').set(authHeader(token)).send(payload);
  expect(res.status).toBe(201);
  return res;
}
function getPerson(id, token) {
  return request(app).get(`/persons/${id}`).set(authHeader(token));
}
function updatePerson(id, token, body) {
  return request(app).put(`/persons/${id}`).set(authHeader(token)).send(body);
}
function deletePerson(id, token) {
  return request(app).delete(`/persons/${id}`).set(authHeader(token));
}

// BUSINESS
async function createBusiness(token, overrides = {}) {
  const payload = makeBusinessPayload(overrides);
  const res = await request(app).post('/businesses').set(authHeader(token)).send(payload);
  expect(res.status).toBe(201);
  return res;
}
function getBusiness(id, token) {
  return request(app).get(`/businesses/${id}`).set(authHeader(token));
}
function updateBusiness(id, token, body) {
  return request(app).put(`/businesses/${id}`).set(authHeader(token)).send(body);
}
function deleteBusiness(id, token) {
  return request(app).delete(`/businesses/${id}`).set(authHeader(token));
}

// OWNED ACCOUNTS
async function createOwnedAccount(myId, token, { type = 'MERCHANT' } = {}) {
  const res = await request(app)
    .post(`/myAccounts/${myId}/accounts`)
    .set(authHeader(token))
    .send({ type });
  expect(res.status).toBe(201);
  return res;
}

function postOwnedAccount(myId, token, body) {
  return request(app)
    .post(`/myAccounts/${myId}/accounts`)
    .set(authHeader(token))
    .send(body);
}

function listOwnedAccounts(myId, token) {
  return request(app)
    .get(`/myAccounts/${myId}/accounts`)
    .set(authHeader(token));
}

function getOwnedAccount(myId, accountId, token) {
  return request(app).get(`/myAccounts/${myId}/accounts/${accountId}`).set(authHeader(token));
}

function updateOwnedAccount(myId, accountId, token, body) {
  return request(app)
    .put(`/myAccounts/${myId}/accounts/${accountId}`)
    .set(authHeader(token))
    .send(body);
}

function deleteOwnedAccount(myId, accountId, token) {
  return request(app)
    .delete(`/myAccounts/${myId}/accounts/${accountId}`)
    .set(authHeader(token));
}

module.exports = {
  login,
  ensureAdminAndLogin,
  createPerson, getPerson, updatePerson, deletePerson,
  createBusiness, getBusiness, updateBusiness, deleteBusiness,
  createOwnedAccount, postOwnedAccount, listOwnedAccounts, getOwnedAccount, updateOwnedAccount, deleteOwnedAccount,
};
