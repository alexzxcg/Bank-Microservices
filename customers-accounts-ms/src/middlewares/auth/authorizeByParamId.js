const { AppError } = require('../error/errorHandler');

function authorizeByParamId(paramName = 'id') {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('Unauthorized', 401));
    const id = Number(req.params[paramName]);
    if (req.user.type === 'ADMIN' || req.user.id === id) return next();
    return next(new AppError('Forbidden', 403));
  };
}

module.exports = { authorizeByParamId };
