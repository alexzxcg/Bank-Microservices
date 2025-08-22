const Services = require('./Services');
const PersonAggregateRepository = require('../repositories/PersonAggregateRepository');

const PersonOutputDTO = require('../dtos/person-dto/PersonOutputDTO');
const PersonReadDTO = require('../dtos/person-dto/PersonReadDTO');
const { hashPassword } = require('../utils/password');
const { AppError } = require('../middlewares/error/errorHandler');

class PersonServices extends Services {
  constructor() {
    super(PersonAggregateRepository, {
      ReadDTO: PersonReadDTO,
      CreateOutputDTO: PersonOutputDTO,
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
    // permitir troca de senha opcionalmente
    if (data.password) {
      data.passwordHash = await hashPassword(data.password);
      delete data.password;
    }
  }
}

module.exports = PersonServices;
