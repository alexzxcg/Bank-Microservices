const yup = require('yup');
const { toDigits } = require('./_sharedTransforms');
const { validateCPF } = require('../../../utils/validateCPF');

const personUpdateSchema = yup
  .object({
    type: yup.mixed().oneOf(['PERSON']).optional(),

    name: yup.string().min(3).optional(),
    email: yup.string().email().optional(),
    birthDate: yup.date().typeError('birthDate must be date').nullable().optional(),
    phone: yup.string().nullable().optional(),
    street: yup.string().nullable().optional(),
    number: yup.string().nullable().optional(),
    district: yup.string().nullable().optional(),
    city: yup.string().nullable().optional(),
    state: yup.string().max(2).nullable().optional(),
    zipCode: yup.string().nullable().optional(),

    monthlyIncome: yup
      .number()
      .typeError('monthlyIncome must be number')
      .positive('monthlyIncome must be positive')
      .nullable()
      .optional(),

    cpf: yup
      .string()
      .transform((v) => (v ? toDigits(v) : v))
      .nullable()
      .optional()
      .test('len-11-if-present', 'cpf must have 11 digits', (v) => v == null || v.length === 11)
      .test('no-repeat-if-present', 'cpf cannot be a repeated sequence', (v) => !v || !/^(\d)\1{10}$/.test(v))
      .test('check-digits-if-present', 'Invalid cpf', (v) => !v || validateCPF(v)),
  })
  .noUnknown(true, 'unknown fields are not allowed')
  .test('at-least-one', 'at least one field must be provided', (obj) =>
    Object.keys(obj || {}).some((k) => obj[k] !== undefined)
  );

module.exports = { personUpdateSchema };
