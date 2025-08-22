const Repository = require('./Repository');
const { Customer } = require('../models');
const { AppError } = require('../middlewares/error/errorHandler.js');

class CustomerRepository extends Repository {
  constructor() { super(Customer); }

  async findTypeById(id, ctx) {
    const c = await this.findByIdOrThrow(id, ctx);
    return { id: c.id, type: c.type };
  }
}

module.exports = new CustomerRepository();
