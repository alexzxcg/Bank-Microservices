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
    super(AccountRepository, { ReadDTO: AccountReadDTO, CreateOutputDTO: AccountOutputDTO });
    this.accountRepository = AccountRepository;
    this.customerRepository = CustomerRepository;
  }

  // Gera números no formato 12345-6 e garante unicidade no banco
  async generateUniqueAccountNumber(maxAttempts = 20) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const five = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
      const dv = String(Math.floor(Math.random() * 10));
      const candidate = `${five}-${dv}`;
      const exists = await this.accountRepository.findByNumber(candidate);
      if (!exists) return candidate;
    }
    throw new AppError('Could not generate a unique account number. Try again.', 500);
  }

  async beforeCreate(data) {
    data.type = data.type?.toUpperCase();
    const { type: customerType } = await this.customerRepository.findTypeById(data.customerId);
    AccountCreationPolicy.assertCanCreate({ customerType, accountType: data.type });

    data.branch = DEFAULT_BRANCH;
    data.number = await this.generateUniqueAccountNumber();
  }


  async findByNumber(number) {
    const account = await this.accountRepository.findByNumber(number);
    if (!account) throw new AppError('Account not found', 404);
    return new AccountReadDTO(account);
  }

  async changeBalance(accountId, newBalance) {
    const account = await this.accountRepository.updateBalance(accountId, newBalance);
    if (!account) throw new AppError('Account not found', 404);
    return { message: 'Balance updated successfully' };
  }

  async findAllByOwner(customerId) {
    const list = await this.accountRepository.findAllByCustomer(customerId);
    return list.map((a) => new AccountReadDTO(a));
  }

  async findOwnedById(customerId, accountId) {
    const acc = await this.accountRepository.findByIdAndCustomer(accountId, customerId);
    if (!acc) throw new AppError('Account not found', 404);
    return new AccountReadDTO(acc);
  }

  async createOwned(customerId, dto) {
    dto.customerId = customerId;
    return super.create(dto);
  }

  async beforeUpdate(id, data) {
    if (
      data.number !== undefined ||
      data.branch !== undefined ||
      data.balance !== undefined ||
      data.active !== undefined ||
      data.customerId !== undefined
    ) {
      throw new AppError('Only type can be changed', 400);
    }

    if (data.type !== undefined) {
      data.type = data.type?.toUpperCase();
      const acc = await this.accountRepository.findByIdOrThrow(id);
      const { type: customerType } = await this.customerRepository.findTypeById(acc.customerId);

      AccountCreationPolicy.assertCanCreate({ customerType, accountType: data.type });
    }
  }

  async updateOwned(customerId, accountId, dto) {
    if (dto.customerId && Number(dto.customerId) !== customerId) {
      throw new AppError('customerId cannot be changed', 400);
    }
    if (
      dto.number !== undefined ||
      dto.branch !== undefined ||
      dto.balance !== undefined ||
      dto.active !== undefined
    ) {
      throw new AppError('Only type can be changed', 400);
    }

    const acc = await this.accountRepository.findByIdAndCustomer(accountId, customerId);
    if (!acc) throw new AppError('Account not found', 404);

    if (dto.type !== undefined) {
      dto.type = dto.type?.toUpperCase();  
      const { type: customerType } = await this.customerRepository.findTypeById(customerId);
      AccountCreationPolicy.assertCanCreate({ customerType, accountType: dto.type });

      if (dto.type === acc.type) {
        return new AccountReadDTO(acc);
      }
    }

    const updated = await this.accountRepository.updateOwned(accountId, customerId, { type: dto.type });
    return new AccountReadDTO(updated);
  }


  async deleteOwned(customerId, accountId) {
    const ok = await this.accountRepository.deleteOwned(accountId, customerId);
    if (!ok) throw new AppError('Account not found', 404);
    return true;
  }
}

module.exports = AccountServices;
