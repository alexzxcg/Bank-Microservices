const Services = require('./Services.js');
const AccountRepository = require('../repositories/AccountRepository.js');
const CustomerRepository = require('../repositories/CustomerRepository.js');

const AccountReadDTO = require('../dtos/account-dto/AccountReadDTO.js');
const AccountOutputDTO = require('../dtos/account-dto/AccountOutputDTO.js');

const { AppError } = require('../middlewares/error/errorHandler.js');
const AccountCreationPolicy = require('../domain/policies/AccountCreationPolicy.js');

const DEFAULT_BRANCH = '4402';

class AccountServices extends Services {
  constructor() {
    const accountRepo = new AccountRepository();
    super(accountRepo, { ReadDTO: AccountReadDTO, CreateOutputDTO: AccountOutputDTO });

    this.customerRepository = new CustomerRepository();
  }

  // Gera números no formato 12345-6 e garante unicidade no banco
  async generateUniqueAccountNumber(ctx, maxAttempts = 20) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const five = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
      const dv = String(Math.floor(Math.random() * 10));
      const candidate = `${five}-${dv}`;
      const exists = await this.repository.findByNumber(candidate, ctx);
      if (!exists) return candidate;
    }
    throw new AppError('Could not generate a unique account number. Try again.', 500);
  }

  async beforeCreate(data, ctx = {}) {
    const customerId = data?.customerId;
    if (!customerId) throw new AppError('customerId is required', 400);

    data.type = data.type?.toUpperCase();

    const { type: customerType } = await this.customerRepository.findTypeById(customerId, ctx);
    AccountCreationPolicy.assertCanCreate({ customerType, accountType: data.type });

    data.customerId = customerId;
    data.branch = DEFAULT_BRANCH;
    data.number = await this.generateUniqueAccountNumber(ctx);
  }

  async beforeUpdate(id, data, ctx = {}) {
    const customerId = ctx?.customerId;
    if (!customerId) throw new AppError('customerId is required', 400);

    if (
      data.number !== undefined ||
      data.branch !== undefined ||
      data.balance !== undefined ||
      data.active !== undefined ||
      data.id !== undefined
    ) {
      throw new AppError('Only type can be changed', 400);
    }

    if (data.type !== undefined) {
      data.type = data.type?.toUpperCase();

      const acc = await this.repository.findById(id, customerId, {
        transaction: ctx.transaction || null,
        includeInactive: false,
      });

      const { type: customerType } = await this.customerRepository.findTypeById(acc.customerId, ctx);
      AccountCreationPolicy.assertCanCreate({ customerType, accountType: data.type });
    }
  }

  async update(dto, id, customerId, ctx = {}) {
    const mergedCtx = { ...ctx, customerId };
    await this.beforeUpdate(id, dto, mergedCtx);

    const updated = await this.repository.update(id, { type: dto.type }, customerId, mergedCtx);
    return new AccountReadDTO(updated);
  }

  async findByNumber(number, ctx = {}) {
    const account = await this.repository.findByNumber(number, ctx);
    if (!account) throw new AppError('Account not found', 404);
    return new AccountReadDTO(account);
  }

  async changeBalance(accountId, newBalance, ctx = {}) {
    const account = await this.repository.updateBalance(accountId, newBalance, ctx);
    if (!account) throw new AppError('Account not found', 404);
    return { message: 'Balance updated successfully' };
  }

  async findAll(customerId, ctx = {}) {
    const list = await this.repository.findAll(customerId, ctx);
    return list.map((a) => new AccountReadDTO(a));
  }

  async findById(id, customerId, ctx = {}) {
    const acc = await this.repository.findById(id, customerId, {
      transaction: ctx.transaction || null,
      includeInactive: true,
    });
    return new AccountReadDTO(acc);
  }

  async delete(id, customerId, ctx = {}) {
    return await this.repository.delete(id, customerId, ctx);
  }
}

module.exports = AccountServices;
