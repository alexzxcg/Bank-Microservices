const yup = require('yup');
const { toTrim } = require('./_sharedTransforms');


const businessUpdateSchema = yup
  .object({
    name: yup.string().transform(toTrim).min(3).optional(),
    birthDate: yup.date().typeError('birthDate must be date').nullable().optional(),
    phone: yup.string().transform(toTrim).nullable().optional(),
    street: yup.string().transform(toTrim).nullable().optional(),
    number: yup.string().transform(toTrim).nullable().optional(),
    district: yup.string().transform(toTrim).nullable().optional(),
    city: yup.string().transform(toTrim).nullable().optional(),
    state: yup.string().transform(toTrim).max(2).nullable().optional(),
    zipCode: yup.string().transform(toTrim).nullable().optional(),

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
