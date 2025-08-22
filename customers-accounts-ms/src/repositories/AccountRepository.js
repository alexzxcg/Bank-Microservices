const SoftDeleteRepository = require('./SoftDeleteRepository');
const { Account } = require('../models');

class AccountRepository extends SoftDeleteRepository {
  constructor() { super(Account); }

  async findByNumber(number) {
    return this.model.findOne({
      where: { number, active: true },
      attributes: ['id', 'number', 'branch', 'type', 'balance', 'active', 'customerId'],
    });
  }

  async findAllByCustomer(customerId) {
    return this.model.findAll({
      where: { customerId },
      order: [['id', 'ASC']],
    });
  }

  async findByIdAndCustomer(accountId, customerId) {
    return this.model.findOne({ where: { id: accountId, customerId } });
  }

  async updateOwned(accountId, customerId, dto) {
    const data = {};
    if (dto.type !== undefined) data.type = dto.type;

    const [count] = await this.model.update(data, { where: { id: accountId, customerId } });
    if (count === 0) return null;
    return this.model.findOne({ where: { id: accountId, customerId } });
  }
  
  async deleteOwned(accountId, customerId) {
    const [count] = await this.model.update(
      { active: false },
      { where: { id: accountId, customerId } }
    );
    return count > 0;
  }

  async updateBalance(accountId, newBalance) {
    const account = await this.model.findByPk(accountId);
    if (!account) return null;
    account.balance = newBalance;
    await account.save();
    return account;
  }
}

module.exports = new AccountRepository();
