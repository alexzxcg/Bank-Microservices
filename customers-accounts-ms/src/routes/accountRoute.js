const { Router } = require('express');
const authenticate = require('../middlewares/auth/authenticate');
const { authorizeSelfOrAdmin } = require('../middlewares/auth/authorize');
const validate = require('../middlewares/validation/validateFactory');

const { accountCreateSchema } = require('../middlewares/validation/schemas/accountCreateSchema');
const { accountUpdateSchema } = require('../middlewares/validation/schemas/accountUpdateSchema');

const AccountController = require('../controllers/AccountController');
const controller = new AccountController();

const router = Router();

const validateParams = (req, _res, next) => {
  const myId = Number(req.params.myId);
  if (!Number.isInteger(myId) || myId <= 0) {
    return next(new Error('myId must be a positive integer'));
  }
  if (req.params.accountId !== undefined) {
    const accId = Number(req.params.accountId);
    if (!Number.isInteger(accId) || accId <= 0) {
      return next(new Error('accountId must be a positive integer'));
    }
  }
  return next();
};

const injectCustomerId = (req, _res, next) => {
  req.body.customerId = Number(req.params.myId);
  return next();
};

router.get(
  '/myAccounts/:myId/accounts',
  authenticate,
  authorizeSelfOrAdmin,
  validateParams,
  controller.listMine
);

router.get(
  '/myAccounts/:myId/accounts/:accountId',
  authenticate,
  authorizeSelfOrAdmin,
  validateParams,
  controller.getMineById
);

router.post(
  '/myAccounts/:myId/accounts',
  authenticate,
  authorizeSelfOrAdmin,
  validateParams,
  injectCustomerId,
  validate(accountCreateSchema),
  controller.createMine
);

router.put(
  '/myAccounts/:myId/accounts/:accountId',
  authenticate,
  authorizeSelfOrAdmin,
  validateParams,
  injectCustomerId,
  validate(accountUpdateSchema),
  controller.updateMine
);

router.delete(
  '/myAccounts/:myId/accounts/:accountId',
  authenticate,
  authorizeSelfOrAdmin,
  validateParams,
  controller.removeMine
);

module.exports = router;