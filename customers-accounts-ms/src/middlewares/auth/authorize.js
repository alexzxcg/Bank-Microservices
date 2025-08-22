const { AppError } = require('../error/errorHandler');

function authorizeRoles(...allowedTypes) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('Unauthorized', 401));
    if (!allowedTypes.includes(req.user.type)) {
      return next(new AppError('Forbidden', 403));
    }
    return next();
  };
}

function authorizeSelfOrAdmin(req, _res, next) {
  if (!req.user) return next(new AppError('Unauthorized', 401));
  const myId = Number(req.params.myId);
  if (req.user.type === 'ADMIN' || req.user.id === myId) {
    return next();
  }
  return next(new AppError('Forbidden', 403));
}

module.exports = { authorizeRoles, authorizeSelfOrAdmin };
