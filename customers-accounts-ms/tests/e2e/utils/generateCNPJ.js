function generateCNPJ() {
  const rand = () => Math.floor(Math.random() * 9);
  const base = [
    rand(), rand(), rand(), rand(),
    rand(), rand(), rand(), rand(), 
    0, 0, 0, 1                     
  ];

  const calcDV = (numbers) => {
    const weights = numbers.length === 12
      ? [5,4,3,2,9,8,7,6,5,4,3,2]
      : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    const sum = numbers.reduce((acc, n, i) => acc + n * weights[i], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calcDV(base);
  const d2 = calcDV([...base, d1]);

  const digits = [...base, d1, d2];
  return digits.join('');
}

module.exports = { generateCNPJ };
