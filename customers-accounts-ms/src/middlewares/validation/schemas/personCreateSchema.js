const yup = require('yup');
const { customerBaseSchema } = require('./customerBaseSchema');
const { toDigits } = require('./_sharedTransforms');
const { validateCPF } = require('../../../utils/validateCPF');

const personCreateSchema = yup
  .object({
    type: yup.mixed().oneOf(['PERSON']).required('type must be PERSON'),

    ...customerBaseSchema,

    monthlyIncome: yup
      .number()
      .typeError('monthlyIncome must be number')
      .positive('monthlyIncome must be positive')
      .nullable()
      .optional(),

    cpf: yup
      .string()
      .transform((v) => (v ? toDigits(v) : v))
      .required('cpf is required')
      .test('len-11', 'cpf must have 11 digits', (v) => !v || v.length === 11)
      .test('no-repeat', 'cpf cannot be a repeated sequence', (v) => !v || !/^(\d)\1{10}$/.test(v))
      .test('check-digits', 'Invalid cpf', (v) => !v || validateCPF(v)),
  })
  .noUnknown(true, 'unknown fields are not allowed');

module.exports = { personCreateSchema };
