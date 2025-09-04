class Repository {
  constructor() {
    if (new.target === Repository) {
      throw new Error('Repository is abstract and cannot be instantiated directly');
    }
  }

  async create(/* dto, ctx */) { throw new Error('NotImplementedError: create(dto, ctx)'); }
  async findById(/* id, ctx */) { throw new Error('NotImplementedError: findById(id, ctx)'); }
  async findAll(/* ctx */) { throw new Error('NotImplementedError: findAll(ctx)'); }
  async update(/* dto, id, ctx */) { throw new Error('NotImplementedError: update(dto, id, ctx)'); }
  async delete(/* id, ctx */) { throw new Error('NotImplementedError: delete(id, ctx)'); }
  async softDelete(/* id, ctx */) { throw new Error('NotImplementedError: softDelete(id, ctx)'); }
}

module.exports = Repository;
