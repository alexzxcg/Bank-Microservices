const { Customer } = require('../models');

class AuthRepository {
  async findByEmail(email) {
    return Customer.findOne({ where: { email: String(email).toLowerCase() } });
  }
}

module.exports = new AuthRepository();
