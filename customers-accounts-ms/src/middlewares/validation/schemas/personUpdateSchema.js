const yup = require('yup');
const { toTrim, toUpper } = require('./_sharedTransforms');

const personUpdateSchema = yup
  .object({
    name: yup.string().transform(toTrim).min(3).optional(),
    birthDate: yup.date().typeError('birthDate must be date').nullable().optional(),
    phone: yup.string().nullable().optional(),
    street: yup.string().nullable().optional(),
    number: yup.string().nullable().optional(),
    district: yup.string().nullable().optional(),
    city: yup.string().nullable().optional(),
    state: yup
      .string()
      .transform((v) => (v ? toUpper(toTrim(v)) : v))
      .max(2, 'state must have max 2 chars')
      .nullable()
      .optional(),
    zipCode: yup.string().nullable().optional(),

    monthlyIncome: yup
      .number()
      .typeError('monthlyIncome must be number')
      .positive('monthlyIncome must be positive')
      .nullable()
      .optional(),
  })
  .noUnknown(true, 'unknown fields are not allowed')
  .test('at-least-one', 'at least one field must be provided', (obj) =>
    Object.keys(obj || {}).some((k) => obj[k] !== undefined)
  );

module.exports = { personUpdateSchema };
