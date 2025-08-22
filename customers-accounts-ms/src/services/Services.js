const { AppError } = require('../middlewares/error/errorHandler.js');

class Services {
  constructor(repository, { ReadDTO = null, CreateOutputDTO = null } = {}) {
    this.repository = repository;
    this.ReadDTO = ReadDTO;
    this.CreateOutputDTO = CreateOutputDTO;
  }

  async beforeCreate(data, ctx) {}
  async afterCreate(entity, ctx) {}
  async beforeUpdate(id, data, ctx) {}
  async afterUpdate(entity, ctx) {}
  async beforeDelete(id, ctx) {}

  toRead(entity) {
    return this.ReadDTO ? new this.ReadDTO(entity) : entity;
  }
  toReadList(list) {
    return this.ReadDTO ? list.map((e) => new this.ReadDTO(e)) : list;
  }

  async findAll(ctx = {}) {
    const list = await this.repository.findAll(ctx);
    return this.toReadList(list);
  }

  async findById(id, ctx = {}) {
    const entity = await this.repository.findByIdOrThrow(id, ctx);
    return this.toRead(entity);
  }

  async create(data, ctx = {}) {
    await this.beforeCreate(data, ctx);
    const created = await this.repository.create(data, ctx);
    await this.afterCreate(created, ctx);

    if (ctx.raw) return created;

    if (this.CreateOutputDTO) {
      return new this.CreateOutputDTO(created);
    }
    return { id: created.id };
  }

  async update(data, id, ctx = {}) {
    await this.beforeUpdate(id, data, ctx);
    const updated = await this.repository.update(data, id, ctx);
    await this.afterUpdate(updated, ctx);
    return ctx.raw ? updated : this.toRead(updated);
  }

  async delete(id, ctx = {}) {
    await this.beforeDelete(id, ctx);
    return this.repository.delete(id, ctx);
  }
}

module.exports = Services;
