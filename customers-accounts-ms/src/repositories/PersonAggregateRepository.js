const { AppError } = require('../middlewares/error/errorHandler');
const { Customer, Person, sequelize } = require('../models');
const Repository = require('./Repository');

const {
  mapCustomerCommon,
  mapCustomerCommonPartial,
  mapPerson,
  mapPersonPartial,
} = require('../utils/mappers/customerMapper');

const customerBase = new Repository(Customer);
const personBase = new Repository(Person);

class PersonAggregateRepository {
  async findAll({ transaction = null } = {}) {
    return Customer.findAll({
      where: { type: 'PERSON' },
      include: [{ model: Person, as: 'person' }],
      transaction,
    });
  }

  async findByIdOrThrow(id, { transaction = null } = {}) {
    const customer = await Customer.findByPk(id, {
      include: [{ model: Person, as: 'person' }],
      transaction,
    });

    if (!customer) throw new AppError('Record not found', 404);
    if (customer.type !== 'PERSON') throw new AppError('Customer is not of type PERSON', 400);
    return customer;
  }

  async create(dto) {
    return sequelize.transaction(async (t) => {
      const customer = await customerBase.create(
        { type: 'PERSON', ...mapCustomerCommon(dto) },
        { transaction: t }
      );

      await personBase.create(
        { ...mapPerson(dto), customerId: customer.id },
        { transaction: t }
      );

      return this.findByIdOrThrow(customer.id, { transaction: t });
    });
  }

  async update(dto, id) {
    return sequelize.transaction(async (t) => {
      const c = await customerBase.findByIdOrThrow(id, { transaction: t });
      if (c.type !== 'PERSON') throw new AppError('Customer is not of type PERSON', 400);

      await customerBase.update(mapCustomerCommonPartial(dto), id, { transaction: t });

      const [count] = await Person.update(mapPersonPartial(dto), {
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
      if (c.type !== 'PERSON') throw new AppError('Customer is not of type PERSON', 400);

      await c.destroy({ transaction: t });
      return true;
    });
  }
}

module.exports = new PersonAggregateRepository();
