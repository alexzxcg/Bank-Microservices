const Repository = require('./Repository');
const { Customer } = require('../models');
const { AppError } = require('../middlewares/error/errorHandler.js');

class CustomerRepository extends Repository {
  constructor() {
    super(Customer);
  }

  async findTypeById(id, ctx = {}) {
    const row = await Customer.findByPk(id, {
      attributes: ['id', 'type'],
      transaction: ctx.transaction, 
    });
    if (!row) throw new AppError('Customer not found', 404);
    return row.get({ plain: true }); 
  }
}

module.exports = new CustomerRepository();
