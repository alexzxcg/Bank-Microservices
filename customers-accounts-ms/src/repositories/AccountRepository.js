const Repository = require('./Repository');
const { AppError } = require('../middlewares/error/errorHandler');
const { Account } = require('../models');

class AccountRepository extends Repository {
  constructor() {
    super();
    this.Account = Account;
  }

  async create(payload, ctx = {}) {
    if (!payload?.customerId) throw new AppError('customerId is required', 400);
    try {
      return await this.Account.create(payload, { transaction: ctx.transaction || null });
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError' || e.name === 'SequelizeValidationError') {
        throw new AppError('Error creating record', 400, [e.message]);
      }
      throw e;
    }
  }

  async findById(id, customerId, ctx = {}) {
    const includeInactive = ctx.includeInactive ?? true;
    const where = { id, customerId };
    if (!includeInactive) where.active = true;

    const row = await this.Account.findOne({
      where,
      transaction: ctx.transaction || null,
    });

    if (!row) throw new AppError('Account not found', 404);
    return row;
  }

  async findAll(customerId, ctx = {}) {
    if (!customerId) throw new AppError('customerId is required', 400);

    return this.Account.findAll({
      where: { customerId, active: true },
      order: [['id', 'ASC']],
      transaction: ctx.transaction || null,
    });
  }

  async update(accountId, updates, customerId, ctx = {}) {
    if (!customerId) throw new AppError('customerId is required', 400);

    const forbidden = ['number', 'branch', 'balance', 'active', 'customerId', 'id'];
    Object.keys(updates || {}).forEach((k) => {
      if (forbidden.includes(k)) throw new AppError('Only type can be changed', 400);
    });

    const [count] = await this.Account.update(updates, {
      where: { id: accountId, customerId, active: true },
      transaction: ctx.transaction || null,
    });

    if (count === 0) throw new AppError('Record not found for update', 404);

    return this.findById(accountId, customerId, { transaction: ctx.transaction || null });
  }

  async delete(accountId, customerId, ctx = {}) {
    return await this.softDelete(accountId, customerId, ctx);
  }

  async softDelete(accountId, customerId, ctx = {}) {
    if (!customerId) throw new AppError('customerId is required', 400);

    const [count] = await this.Account.update(
      { active: false },
      {
        where: { id: accountId, customerId, active: true },
        transaction: ctx.transaction || null,
      }
    );

    if (count === 0) throw new AppError('Record not found for deletion', 404);
    return true;
  }

  async findByNumber(number, ctx = {}) {
    return this.Account.findOne({
      where: { number, active: true },
      attributes: ['id', 'number', 'branch', 'type', 'balance', 'active', 'customerId'],
      transaction: ctx.transaction || null,
    });
  }

  async updateBalance(accountId, newBalance, ctx = {}) {
    const account = await this.Account.findByPk(accountId, {
      transaction: ctx.transaction || null,
    });
    if (!account || !account.active) return null;

    account.balance = newBalance;
    await account.save({ transaction: ctx.transaction || null });
    return account;
  }
}

module.exports = AccountRepository;