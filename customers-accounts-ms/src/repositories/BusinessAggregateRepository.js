const { AppError } = require('../middlewares/error/errorHandler');
const { Customer, Business, sequelize } = require('../models');
const Repository = require('./Repository');

const {
  mapCustomerCommon,
  mapCustomerCommonPartial,
  mapBusiness,
  mapBusinessPartial,
} = require('../utils/mappers/customerMapper');

const customerBase = new Repository(Customer);
const businessBase = new Repository(Business);

class BusinessAggregateRepository {
  async findAll({ transaction = null } = {}) {
    return Customer.findAll({
      where: { type: 'BUSINESS' },
      include: [{ model: Business, as: 'business' }],
      transaction,
    });
  }

  async findByIdOrThrow(id, { transaction = null } = {}) {
    const customer = await Customer.findByPk(id, {
      include: [{ model: Business, as: 'business' }],
      transaction,
    });

    if (!customer) throw new AppError('Record not found', 404);
    if (customer.type !== 'BUSINESS') throw new AppError('Customer is not of type BUSINESS', 400);
    return customer;
  }

  async create(dto) {
    return sequelize.transaction(async (t) => {
      const customer = await customerBase.create(
        { type: 'BUSINESS', ...mapCustomerCommon(dto) },
        { transaction: t }
      );

      await businessBase.create(
        { ...mapBusiness(dto), customerId: customer.id },
        { transaction: t }
      );

      return this.findByIdOrThrow(customer.id, { transaction: t });
    });
  }

  async update(dto, id) {
    return sequelize.transaction(async (t) => {
      const c = await customerBase.findByIdOrThrow(id, { transaction: t });
      if (c.type !== 'BUSINESS') throw new AppError('Customer is not of type BUSINESS', 400);

      await customerBase.update(mapCustomerCommonPartial(dto), id, { transaction: t });

      const [count] = await Business.update(mapBusinessPartial(dto), {
        where: { customerId: id },
        transaction: t,
      });
      if (count === 0) throw new AppError('Record not found for update', 404);

      return this.findByIdOrThrow(id, { transaction: t });
    });
  }

  async delete(id) {
    return sequelize.transaction(async (t) => {
      const c = await customerBase.findByIdOrThrow(id, { transaction: t });
      if (c.type !== 'BUSINESS') throw new AppError('Customer is not of type BUSINESS', 400);

      await c.destroy({ transaction: t });
      return true;
    });
  }
}

module.exports = new BusinessAggregateRepository();
