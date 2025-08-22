const Repository = require('./Repository');
const { AppError } = require('../middlewares/error/errorHandler.js');

class SoftDeleteRepository extends Repository {
  async delete(id, { transaction } = {}) {
    const [count] = await this.model.update({ active: false }, { where: { id }, transaction });
    if (count === 0) throw new AppError('Record not found for deletion', 404);
    return true;
  }

  async findAllActive(opts = {}) {
    const base = opts.where || {};
    return super.findAll({ ...opts, where: { ...base, active: true } });
  }
}

module.exports = SoftDeleteRepository;
