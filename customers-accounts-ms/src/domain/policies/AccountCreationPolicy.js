const { AppError } = require('../../middlewares/error/errorHandler.js');

const ALLOWED_BY_CUSTOMER_TYPE = {
  BUSINESS: ['MERCHANT'],
  PERSON: ['CHECKING', 'SAVINGS'],
};

class AccountCreationPolicy {
  static assertCanCreate({ customerType, accountType }) {
    const allowed = ALLOWED_BY_CUSTOMER_TYPE[customerType];
    if (!allowed) {
      throw new AppError(`Unsupported customer type: ${customerType}`, 400);
    }
    if (!allowed.includes(accountType)) {
      const msg = `Customers of type ${customerType} can only create accounts: ${allowed.join(', ')}`;
      throw new AppError(msg, 400);
    }
  }
}

module.exports = AccountCreationPolicy;
