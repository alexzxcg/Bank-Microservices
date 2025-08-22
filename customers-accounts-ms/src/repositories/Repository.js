const { AppError } = require('../middlewares/error/errorHandler.js');

class Repository {
  constructor(model) { this.model = model; }

  async findAll({ where = {}, attributes, order, transaction } = {}) {
    return this.model.findAll({ where, attributes, order, transaction });
  }

  async findByIdOrThrow(id, { transaction } = {}) {
    const r = await this.model.findByPk(id, { transaction });
    if (!r) throw new AppError('Record not found', 404);
    return r;
  }

  async findByIdOrNull(id, { transaction } = {}) {
    return this.model.findByPk(id, { transaction });
  }

  async findOneByFieldOrNull(field, value, { transaction } = {}) {
    return this.model.findOne({ where: { [field]: value }, transaction });
  }

  async create(data, { transaction } = {}) {
    try { return await this.model.create(data, { transaction }); }
    catch (e) { throw new AppError('Error creating record', 400, [e.message]); }
  }

  async update(data, id, { transaction } = {}) {
    const [updated] = await this.model.update(data, { where: { id }, transaction });
    if (updated === 0) throw new AppError('Record not found for update', 404);
    return this.model.findByPk(id, { transaction });
  }

  async delete(id, { transaction } = {}) {
    const deleted = await this.model.destroy({ where: { id }, transaction });
    if (deleted === 0) throw new AppError('Record not found for deletion', 404);
    return true;
  }
}

module.exports = Repository;
