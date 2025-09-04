const yup = require('yup');

const allowedTypes = ['CHECKING', 'SAVINGS', 'MERCHANT'];

const toUpper = (v) => (typeof v === 'string' ? v.toUpperCase() : v);

const accountCreateSchema = yup
  .object({
    type: yup
      .string()
      .transform(toUpper)
      .oneOf(allowedTypes, 'one of: CHECKING, SAVINGS, MERCHANT')
      .required('Account type is required'),
  })
  .noUnknown(true, 'unknown fields');

module.exports = { accountCreateSchema };
