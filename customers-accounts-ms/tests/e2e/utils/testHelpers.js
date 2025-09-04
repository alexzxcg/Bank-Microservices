function uniqueEmail(prefix = 'e2e') {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random()*1e6)}@example.com`;
}

function expectIfPresent(obj, key, expected) {
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    expect(obj[key]).toEqual(expected);
  }
}

async function expectOwnedAccount404(api, myId, accountId, token) {
  await api.getOwnedAccount(myId, accountId, token).expect(404);
}

module.exports = { uniqueEmail, expectIfPresent, expectOwnedAccount404 };
