const { Router } = require('express');
const authenticate = require('../middlewares/auth/authenticate');
const { authorizeSelfOrAdmin } = require('../middlewares/auth/authorize');
const validate = require('../middlewares/validation/validateFactory');
const { AppError } = require('../middlewares/error/errorHandler');

const { accountCreateSchema } = require('../middlewares/validation/schemas/accountCreateSchema');
const { accountUpdateSchema } = require('../middlewares/validation/schemas/accountUpdateSchema');

const AccountController = require('../controllers/AccountController');
const controller = new AccountController();

const router = Router();

const validateParams = (req, _res, next) => {
  const myId = Number(req.params.myId);
  if (!Number.isInteger(myId) || myId <= 0) {
    return next(new AppError('Validation error', 400, ['myId must be a positive integer']));
  }
  if (req.params.accountId !== undefined) {
    const accId = Number(req.params.accountId);
    if (!Number.isInteger(accId) || accId <= 0) {
      return next(new AppError('Validation error', 400, ['accountId must be a positive integer']));
    }
  }
  return next();
};

router.get(
  '/myAccounts/:myId/accounts',
  authenticate,
  validateParams,
  authorizeSelfOrAdmin,
  controller.findAll
);

router.get(
  '/myAccounts/:myId/accounts/:accountId',
  authenticate,
  validateParams,
  authorizeSelfOrAdmin,
  controller.findById
);

router.post(
  '/myAccounts/:myId/accounts',
  authenticate,
  validateParams,
  authorizeSelfOrAdmin,
  validate(accountCreateSchema),
  controller.create
);

router.put(
  '/myAccounts/:myId/accounts/:accountId',
  authenticate,
  validateParams,
  authorizeSelfOrAdmin,
  validate(accountUpdateSchema),
  controller.update
);

router.delete(
  '/myAccounts/:myId/accounts/:accountId',
  authenticate,
  validateParams,
  authorizeSelfOrAdmin,
  controller.delete
);

module.exports = router;