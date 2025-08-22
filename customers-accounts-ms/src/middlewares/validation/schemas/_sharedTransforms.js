const toDigits = (v) => (typeof v === 'string' ? v.replace(/\D/g, '') : v);
const toTrim = (v) => (typeof v === 'string' ? v.trim() : v);
const toLower = (v) => (typeof v === 'string' ? v.toLowerCase() : v);
const toUpper = (v) => (typeof v === 'string' ? v.toUpperCase() : v);

module.exports = { toDigits, toTrim, toLower, toUpper };
