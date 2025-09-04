const AuthSubjectServices = require('./_shared/AuthSubjectServices');
const BusinessRepository = require('../repositories/BusinessRepository');

const BusinessOutputDTO = require('../dtos/business-dto/BusinessOutputDTO');
const BusinessReadDTO = require('../dtos/business-dto/BusinessReadDTO');

class BusinessServices extends AuthSubjectServices {
  constructor() {
    super(
      new BusinessRepository(),
      { ReadDTO: BusinessReadDTO, CreateOutputDTO: BusinessOutputDTO },
      { plainField: 'password', hashField: 'passwordHash', requireOnCreate: true }
    );
  }

  async beforeDelete(id, ctx = {}) {
    await this.repository.findById(id, ctx);
  }
}

module.exports = BusinessServices;
