const yup = require('yup');
const { AppError, asyncHandler } = require('../middlewares/error/errorHandler.js');

class Controller {
  constructor(entityService, { CreateDTO = null, UpdateDTO = null } = {}) {
    this.entityService = entityService;
    this.CreateDTO = CreateDTO;
    this.UpdateDTO = UpdateDTO;
  }

  buildCtx(req) {
    return {
      transaction: null,
      user: req.user || null,
      correlationId: req.headers['x-correlation-id'],
      raw: false,
    };
  }

  findAll = asyncHandler(async (req, res) => {
    const ctx = this.buildCtx(req);
    const list = await this.entityService.findAll(ctx);
    return res.status(200).json(list);
  });

  findById = asyncHandler(async (req, res) => {
    const ctx = this.buildCtx(req);
    const { id } = req.params;
    const record = await this.entityService.findById(Number(id), ctx);
    return res.status(200).json(record);
  });

  create = asyncHandler(async (req, res) => {
    const ctx = this.buildCtx(req);
    try {
      const body = this.CreateDTO ? new this.CreateDTO(req.body) : req.body;
      const created = await this.entityService.create(body, ctx);
      return res.status(201).json(created);
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        throw new AppError('Validation error', 400, err.errors);
      }
      throw err;
    }
  });

  update = asyncHandler(async (req, res) => {
    const ctx = this.buildCtx(req);
    const { id } = req.params;
    const body = this.UpdateDTO ? new this.UpdateDTO(req.body) : req.body;
    const updated = await this.entityService.update(body, Number(id), ctx);
    return res.status(200).json(updated);
  });

  delete = asyncHandler(async (req, res) => {
    const ctx = this.buildCtx(req);
    const { id } = req.params;
    await this.entityService.delete(Number(id), ctx);
    return res.status(200).json({ message: `ID ${id} deleted` });
  });

  getAll = this.findAll;
  getById = this.findById;
  remove = this.delete;
}

module.exports = Controller;
