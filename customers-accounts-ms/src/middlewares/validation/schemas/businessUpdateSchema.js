const yup = require('yup');
const { toDigits, toTrim } = require('./_sharedTransforms');
const { validateCNPJ } = require('../../../utils/validateCNPJ');

const businessUpdateSchema = yup
  .object({
    type: yup.mixed().oneOf(['BUSINESS']).optional(),

    name: yup.string().transform(toTrim).min(3).optional(),
    email: yup.string().transform(toTrim).email().optional(),
    birthDate: yup.date().typeError('birthDate must be date').nullable().optional(),
    phone: yup.string().transform(toTrim).nullable().optional(),
    street: yup.string().transform(toTrim).nullable().optional(),
    number: yup.string().transform(toTrim).nullable().optional(),
    district: yup.string().transform(toTrim).nullable().optional(),
    city: yup.string().transform(toTrim).nullable().optional(),
    state: yup.string().transform(toTrim).max(2).nullable().optional(),
    zipCode: yup.string().transform(toTrim).nullable().optional(),

    cnpj: yup
      .string()
      .transform((v) => (v ? toDigits(v) : v))
      .nullable()
      .optional()
      .test('len-14-if-present', 'cnpj must have 14 digits', (v) => v == null || v.length === 14)
      .test('no-repeat-if-present', 'CNPJ cannot be a repeated sequence', (v) => !v || !/^(\d)\1{13}$/.test(v))
      .test('check-digits-if-present', 'Invalid CNPJ', (v) => !v || validateCNPJ(v)),

    isIcmsExempt: yup.boolean().optional(),

    stateRegistration: yup
      .string()
      .transform(toTrim)
      .nullable()
      .optional()
      .when('isIcmsExempt', {
        is: false,
        then: (s) => s.required('stateRegistration is required when not ICMS exempt'),
        otherwise: (s) => s.nullable().optional(),
      }),
  })
  .noUnknown(true, 'unknown fields are not allowed')
  .test('at-least-one', 'at least one field must be provided', (obj) =>
    Object.keys(obj || {}).some((k) => obj[k] !== undefined)
  );

module.exports = { businessUpdateSchema };
