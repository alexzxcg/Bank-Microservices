const yup = require('yup');
const { toTrim, toLower } = require('./_sharedTransforms');

const loginSchema = yup.object({
  email: yup
    .string()
    .transform((v) => (v ? toLower(toTrim(v)) : v))
    .email('Invalid email')
    .required('Email is required'),
  password: yup.string().required('Password is required'),
});

module.exports = { loginSchema };
