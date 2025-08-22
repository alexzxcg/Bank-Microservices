const yup = require('yup');
const { customerBaseSchema } = require('./customerBaseSchema');
const { toDigits, toTrim } = require('./_sharedTransforms');
const { validateCNPJ } = require('../../../utils/validateCNPJ');

const businessCreateSchema = yup
  .object({
    type: yup.mixed().oneOf(['BUSINESS']).required('type must be BUSINESS'),

    ...customerBaseSchema,

    cnpj: yup
      .string()
      .transform((v) => (v ? toDigits(v) : v))
      .required('cnpj is required')
      .test('len-14', 'CNPJ must have 14 digits', (v) => !v || v.length === 14)
      .test('no-repeat', 'CNPJ cannot be a repeated sequence', (v) => !v || !/^(\d)\1{13}$/.test(v))
      .test('check-digits', 'Invalid CNPJ', (v) => !v || validateCNPJ(v)),

    isIcmsExempt: yup.boolean().required('isIcmsExempt is required'),

    stateRegistration: yup
      .string()
      .transform(toTrim)
      .nullable()
      .when('isIcmsExempt', {
        is: false,
        then: (s) => s.required('stateRegistration is required when not ICMS exempt'),
        otherwise: (s) => s.nullable().optional(),
      }),
  })
  .noUnknown(true, 'unknown fields are not allowed');

module.exports = { businessCreateSchema };
