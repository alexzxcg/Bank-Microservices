function validateCPF(raw) {
  if (!raw) return false;

  const cpf = String(raw).replace(/\D/g, '');
  if (cpf.length !== 11) return false;

  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += Number(cpf[i]) * (10 - i);
  }
  const remainder1 = sum1 % 11;
  const d1 = remainder1 < 2 ? 0 : 11 - remainder1;

  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += Number(cpf[i]) * (11 - i);
  }
  const remainder2 = sum2 % 11;
  const d2 = remainder2 < 2 ? 0 : 11 - remainder2;

  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

module.exports = { validateCPF };
