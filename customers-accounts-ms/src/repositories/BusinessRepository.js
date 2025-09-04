const CustomerRepository = require('./CustomerRepository');
const { AppError } = require('../middlewares/error/errorHandler');
const { sequelize, Business, Customer } = require('../models');
const {
  mapCustomerCommon,
  mapCustomerCommonPartial,
  mapBusiness,
  mapBusinessPartial,
} = require('../utils/mappers/customerMapper');

class BusinessRepository extends CustomerRepository {
  constructor() {
    super();
    this.Business = Business;
    this.Customer = Customer;
    this.sequelize = sequelize;
  }

  async findByCnpj(cnpj, ctx = {}) {
    const trx = ctx.transaction || null;
    return this.Business.findOne({ where: { cnpj }, transaction: trx });
  }

  async create(dto, ctx = {}) {
    return this.sequelize.transaction(async (t) => {
      const trx = ctx.transaction || t;

      if (dto.email) {
        const emailExists = await super.findByEmail(dto.email, { transaction: trx });
        if (emailExists) throw new AppError('Error creating record', 400, ['email already exists']);
      }
      if (dto.cnpj) {
        const cnpjExists = await this.findByCnpj(dto.cnpj, { transaction: trx });
        if (cnpjExists) throw new AppError('Error creating record', 400, ['cnpj already exists']);
      }

      try {
        const customerId = await super.create(
          { type: 'BUSINESS', ...mapCustomerCommon(dto) },
          { transaction: trx }
        );

        await this.Business.create({ ...mapBusiness(dto), customerId }, { transaction: trx });

        return this.findById(customerId, { transaction: trx });
      } catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError' || e.name === 'SequelizeValidationError') {
          const detail = (e.errors?.[0]?.message || e.message);
          throw new AppError('Error creating record', 400, [detail]);
        }
        throw e;
      }
    });
  }

  async findById(id, ctx = {}) {
    const row = await this.Customer.findByPk(id, {
      include: [{ model: this.Business, as: 'business' }],
      transaction: ctx.transaction || null,
    });
    if (!row) throw new AppError('Record not found', 404);
    if (row.type !== 'BUSINESS') throw new AppError('Customer is not of type BUSINESS', 400);
    return row;
  }

  async findAll(ctx = {}) {
    return this.Customer.findAll({
      where: { type: 'BUSINESS' },
      include: [{ model: this.Business, as: 'business' }],
      transaction: ctx.transaction || null,
    });
  }

  async update(dto, id, ctx = {}) {
    return this.sequelize.transaction(async (t) => {
      const trx = ctx.transaction || t;
      await this.findById(id, { transaction: trx });

      const customerPatch = mapCustomerCommonPartial(dto);
      const businessPatch = mapBusinessPartial(dto);

      if (Object.keys(customerPatch).length > 0) {
        await super.update(customerPatch, id, { transaction: trx });
      }
      if (Object.keys(businessPatch).length > 0) {
        const [count] = await this.Business.update(businessPatch, {
          where: { customerId: id },
          transaction: trx,
        });
        if (count === 0) throw new AppError('Record not found for update', 404);
      }

      return this.findById(id, { transaction: trx });
    });
  }

  async delete(id, ctx = {}) {
    return super.delete(id, ctx);
  }

  async softDelete(_id, _ctx = {}) {
    throw new AppError('Soft delete is not supported for Business', 400);
  }
}

module.exports = BusinessRepository;
