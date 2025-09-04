function generateCPF() {
  const isSequence = (arr) => arr.every((d) => d === arr[0]);

  let base;
  do {
    base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  } while (isSequence(base));

  const calcDV = (nums) => {
    const weightStart = nums.length + 1;
    const sum = nums.reduce((acc, n, i) => acc + n * (weightStart - i), 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calcDV(base);
  const d2 = calcDV([...base, d1]);

  return [...base, d1, d2].join('');
}

module.exports = { generateCPF };
