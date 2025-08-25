const { Customer } = require('../models');

class AuthRepository {
  async findByEmail(email) {
    return Customer.findOne({ where: { email } });
  }
}

module.exports = new AuthRepository();
