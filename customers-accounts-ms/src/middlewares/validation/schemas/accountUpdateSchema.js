const yup = require('yup');

const allowedTypes = ['CHECKING', 'SAVINGS', 'MERCHANT'];

const toUpper = (v) => (typeof v === 'string' ? v.toUpperCase() : v);

const accountUpdateSchema = yup
  .object({
    type: yup
      .string()
      .transform(toUpper)
      .oneOf(allowedTypes, 'one of: CHECKING, SAVINGS, MERCHANT')
      .required('type is required'),
  })
  .noUnknown(true, 'unknown fields');

module.exports = { accountUpdateSchema };
