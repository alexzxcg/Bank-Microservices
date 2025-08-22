const yup = require('yup');
const { toTrim, toLower, toUpper } = require('./_sharedTransforms');

const customerBaseSchema = {
  name: yup.string().transform(toTrim).min(3).required('name is required'),

  email: yup
    .string()
    .transform((v) => (v ? toLower(toTrim(v)) : v))
    .email('email must be valid')
    .required('email is required'),

  password: yup.string()
    .min(8, 'Password must have at least 8 characters')
    .required(),

  birthDate: yup.date().typeError('birthDate must be date').nullable().optional(),

  phone: yup.string().transform(toTrim).nullable().optional(),

  street: yup.string().transform(toTrim).nullable().optional(),
  number: yup.string().transform(toTrim).nullable().optional(),
  district: yup.string().transform(toTrim).nullable().optional(),
  city: yup.string().transform(toTrim).nullable().optional(),
  state: yup
    .string()
    .transform((v) => (v ? toUpper(toTrim(v)) : v))
    .max(2, 'state must have max 2 chars')
    .nullable()
    .optional(),
  zipCode: yup.string().transform(toTrim).nullable().optional(),
};

module.exports = { customerBaseSchema };
