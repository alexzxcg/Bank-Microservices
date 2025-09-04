const Repository = require('./Repository');
const { AppError } = require('../middlewares/error/errorHandler');
const { sequelize, Customer, Person, Business, Account } = require('../models');

class CustomerRepository extends Repository {
  constructor() {
    super();
    this.Customer = Customer;
    this.Person = Person;
    this.Business = Business;
    this.Account = Account;
    this.sequelize = sequelize;
  }

  async findTypeById(id, ctx = {}) {
    const row = await this.Customer.findByPk(id, {
      attributes: ['id', 'type'],
      transaction: ctx.transaction || null,
    });
    if (!row) throw new AppError('Customer not found', 404);
    return row.get({ plain: true });
  }

  async findByEmail(email, ctx = {}) {
    const trx = ctx.transaction || null;
    return this.Customer.findOne({ where: { email: email.toLowerCase() }, transaction: trx });
  }

  async create(dto, ctx = {}) {
    const trx = ctx.transaction || null;
    const payload = { ...dto, email: dto.email?.toLowerCase() };

    const exists = await this.findByEmail(payload.email, { transaction: trx });
    if (exists) throw new AppError('Error creating record', 400, ['email already exists']);

    try {
      const created = await this.Customer.create(payload, { transaction: trx });
      return created.id;
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError' || e.name === 'SequelizeValidationError') {
        throw new AppError('Error creating record', 400, [e.message]);
      }
      throw e;
    }
  }

  async findById(id, ctx = {}) {
    const row = await this.Customer.findByPk(id, { transaction: ctx.transaction || null });
    if (!row) throw new AppError('Customer not found', 404);
    return row;
  }

  async findAll(ctx = {}) {
    return this.Customer.findAll({ transaction: ctx.transaction || null });
  }

  async update(dto, id, ctx = {}) {
    const trx = ctx.transaction || null;
    const [count] = await this.Customer.update(dto, { where: { id }, transaction: trx });
    if (count === 0) throw new AppError('Record not found for update', 404);
    return this.Customer.findByPk(id, { transaction: trx });
  }

  async delete(id, ctx = {}) {
    const run = async (trx) => {
      const customer = await this.Customer.findByPk(id, { transaction: trx });
      if (!customer) throw new AppError('Record not found for deletion', 404);

      await customer.destroy({ transaction: trx });
      return true;
    };

    if (ctx.transaction) return run(ctx.transaction);
    return this.sequelize.transaction(run);
  }


  async softDelete(_id, _ctx = {}) {
    throw new AppError('Soft delete is not supported for Customer', 400);
  }
}

module.exports = CustomerRepository;
