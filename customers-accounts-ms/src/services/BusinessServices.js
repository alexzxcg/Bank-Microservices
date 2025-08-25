const AuthSubjectServices = require('./_shared/AuthSubjectServices');
const BusinessAggregateRepository = require('../repositories/BusinessAggregateRepository');

const BusinessOutputDTO = require('../dtos/business-dto/BusinessOutputDTO');
const BusinessReadDTO = require('../dtos/business-dto/BusinessReadDTO');

class BusinessServices extends AuthSubjectServices {
  constructor() {
    super(
      BusinessAggregateRepository,
      { ReadDTO: BusinessReadDTO, CreateOutputDTO: BusinessOutputDTO },
      { plainField: 'password', hashField: 'passwordHash', requireOnCreate: true }
    );
  }
}

module.exports = BusinessServices;
