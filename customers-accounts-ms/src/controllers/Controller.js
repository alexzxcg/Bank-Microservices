const yup = require('yup');
const { AppError, asyncHandler } = require('../middlewares/error/errorHandler.js');

class Controller {
  constructor(entityService, { CreateDTO = null, UpdateDTO = null } = {}) {
    this.entityService = entityService;
    this.CreateDTO = CreateDTO;
    this.UpdateDTO = UpdateDTO;
  }

  getAll = asyncHandler(async (req, res) => {
    const list = await this.entityService.findAll();
    return res.status(200).json(list);
  });

  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const record = await this.entityService.findById(Number(id));
    return res.status(200).json(record);
  });

  create = asyncHandler(async (req, res) => {
    try {
      const body = this.CreateDTO ? new this.CreateDTO(req.body) : req.body;
      const created = await this.entityService.create(body);
      return res.status(201).json(created);
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        throw new AppError('Validation error', 400, err.errors);
      }
      throw err;
    }
  });

  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const body = this.UpdateDTO ? new this.UpdateDTO(req.body) : req.body;
    const updated = await this.entityService.update(body, Number(id));
    return res.status(200).json(updated);
  });

  remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await this.entityService.delete(Number(id));
    return res.status(200).json({ message: `ID ${id} deleted` });
  });
}

module.exports = Controller;
