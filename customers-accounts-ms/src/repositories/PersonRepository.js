const CustomerRepository = require('./CustomerRepository');
const { AppError } = require('../middlewares/error/errorHandler');
const { sequelize, Person, Customer } = require('../models');
const {
  mapCustomerCommon,
  mapCustomerCommonPartial,
  mapPerson,
  mapPersonPartial,
} = require('../utils/mappers/customerMapper');

class PersonRepository extends CustomerRepository {
  constructor() {
    super();
    this.Person = Person;
    this.Customer = Customer;
    this.sequelize = sequelize;
  }

  async findByCpf(cpf, ctx = {}) {
    const trx = ctx.transaction || null;
    return this.Person.findOne({ where: { cpf }, transaction: trx });
  }

  async create(dto, ctx = {}) {
    return this.sequelize.transaction(async (t) => {
      const trx = ctx.transaction || t;

      if (dto.email) {
        const emailExists = await super.findByEmail(dto.email, { transaction: trx });
        if (emailExists) throw new AppError('Error creating record', 400, ['email already exists']);
      }
      if (dto.cpf) {
        const cpfExists = await this.findByCpf(dto.cpf, { transaction: trx });
        if (cpfExists) throw new AppError('Error creating record', 400, ['cpf already exists']);
      }

      try {
        const customerId = await super.create(
          { type: 'PERSON', ...mapCustomerCommon(dto) },
          { transaction: trx }
        );

        await this.Person.create({ ...mapPerson(dto), customerId }, { transaction: trx });

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
      include: [{ model: this.Person, as: 'person' }],
      transaction: ctx.transaction || null,
    });
    if (!row) throw new AppError('Record not found', 404);
    if (row.type !== 'PERSON') throw new AppError('Customer is not of type PERSON', 400);
    return row;
  }

  async findAll(ctx = {}) {
    return this.Customer.findAll({
      where: { type: 'PERSON' },
      include: [{ model: this.Person, as: 'person' }],
      transaction: ctx.transaction || null,
    });
  }

  async update(dto, id, ctx = {}) {
    return this.sequelize.transaction(async (t) => {
      const trx = ctx.transaction || t;
      await this.findById(id, { transaction: trx });

      const customerPatch = mapCustomerCommonPartial(dto);
      const personPatch = mapPersonPartial(dto);

      if (Object.keys(customerPatch).length > 0) {
        await super.update(customerPatch, id, { transaction: trx });
      }
      if (Object.keys(personPatch).length > 0) {
        const [count] = await this.Person.update(personPatch, {
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
    throw new AppError('Soft delete is not supported for Person', 400);
  }
}

module.exports = PersonRepository;
