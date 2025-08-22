const Services = require('./Services');
const BusinessAggregateRepository = require('../repositories/BusinessAggregateRepository');

const BusinessOutputDTO = require('../dtos/business-dto/BusinessOutputDTO');
const BusinessReadDTO = require('../dtos/business-dto/BusinessReadDTO');
const { hashPassword } = require('../utils/password');
const { AppError } = require('../middlewares/error/errorHandler');

class BusinessServices extends Services {
  constructor() {
    super(BusinessAggregateRepository, {
      ReadDTO: BusinessReadDTO,
      CreateOutputDTO: BusinessOutputDTO,
    });
  }

  async beforeCreate(data, _ctx) {
    if (!data.password) {
      throw new AppError('password is required', 400);
    }
    data.passwordHash = await hashPassword(data.password);
    delete data.password;
  }

  async beforeUpdate(_id, data, _ctx) {
    if (data.password) {
      data.passwordHash = await hashPassword(data.password);
      delete data.password;
    }
  }
}

module.exports = BusinessServices;