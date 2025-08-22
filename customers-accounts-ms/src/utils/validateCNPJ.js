function validateCNPJ(raw) {
  if (!raw) return false;

  const cnpj = String(raw).replace(/\D/g, '');
  if (cnpj.length !== 14) return false;

  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const weights1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  const weights2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];

  const sum = (digits, weights) =>
    digits.reduce((acc, d, i) => acc + Number(d) * weights[i], 0);

  const calcDigit = (base, weights) => {
    const remainder = sum(base, weights) % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const d1 = calcDigit(cnpj.slice(0, 12).split(''), weights1);
  const d2 = calcDigit(cnpj.slice(0, 13).split(''), weights2);

  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

module.exports = { validateCNPJ };
