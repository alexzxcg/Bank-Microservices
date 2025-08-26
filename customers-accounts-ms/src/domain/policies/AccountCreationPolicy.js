const { AppError } = require('../../middlewares/error/errorHandler.js');

const ALLOWED_BY_CUSTOMER_TYPE = {
  BUSINESS: ['MERCHANT'],
  PERSON: ['CHECKING', 'SAVINGS'],
};

class AccountCreationPolicy {
  static assertCanCreate({ customerType, accountType }) {
    const type = String(customerType || '').toUpperCase();
    const acc  = String(accountType  || '').toUpperCase();

    if (type === 'ADMIN') {
      throw new AppError('Admins cannot have accounts', 422);
    }

    const allowed = ALLOWED_BY_CUSTOMER_TYPE[type];
    if (!allowed) {
      throw new AppError(`Unsupported customer type: ${type}`, 400);
    }

    if (!acc) {
      throw new AppError('Account type is required', 400);
    }

    if (!allowed.includes(acc)) {
      const msg = `Customers of type ${type} can only create accounts: ${allowed.join(', ')}`;
      throw new AppError(msg, 400);
    }
  }
}

module.exports = AccountCreationPolicy;
