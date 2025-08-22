/**
 * Remove chaves cujo valor é undefined (imutável).
 */
function omitUndefined(obj = {}) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/**
 * Mantém apenas as chaves permitidas.
 */
function pick(obj = {}, keys = []) {
  const out = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out;
}

/**
 * Composição simples de funções (left-to-right).
 */
const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((acc, fn) => fn(acc), x);

module.exports = { omitUndefined, pick, pipe };
