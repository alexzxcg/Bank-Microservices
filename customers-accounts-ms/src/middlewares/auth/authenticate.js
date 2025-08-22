const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../../src/config/env');
const { AppError } = require('../error/errorHandler');

module.exports = function authenticate(req, _res, next) {
  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Unauthorized', 401));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: Number(payload.sub),
      type: payload.type,
      email: payload.email,
    };
    return next();
  } catch (err) {
    return next(new AppError('Invalid or expired token', 401));
  }
};
