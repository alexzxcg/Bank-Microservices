const yup = require('yup');
const { AppError } = require('../error/errorHandler');

module.exports = (schema) => async (req, _res, next) => {
  try {
    req.body = await schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: false,
    });
    return next();
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      return next(new AppError('Validation error', 400, err.errors));
    }
    return next(new AppError('Internal error while validating payload', 500));
  }
};
