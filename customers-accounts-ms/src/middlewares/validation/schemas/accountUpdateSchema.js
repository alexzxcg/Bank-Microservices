const yup = require('yup');

const accountUpdateSchema = yup
  .object({
    customerId: yup
      .number()
      .typeError('customerId must be a number')
      .integer('customerId must be an integer')
      .positive('customerId must be positive')
      .required('customerId is required'),

    type: yup
      .string()
      .transform((v) => (v ? v.toUpperCase() : v))
      .oneOf(['CHECKING', 'SAVINGS', 'MERCHANT'], 'type must be one of: CHECKING, SAVINGS, MERCHANT')
      .required('type is required'),
  })
  .noUnknown(true, 'unknown fields are not allowed');

module.exports = { accountUpdateSchema };
