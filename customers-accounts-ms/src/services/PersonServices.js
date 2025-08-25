const AuthSubjectServices = require('./_shared/AuthSubjectServices');
const PersonAggregateRepository = require('../repositories/PersonAggregateRepository');

const PersonOutputDTO = require('../dtos/person-dto/PersonOutputDTO');
const PersonReadDTO = require('../dtos/person-dto/PersonReadDTO');

class PersonServices extends AuthSubjectServices {
  constructor() {
    super(
      PersonAggregateRepository,
      { ReadDTO: PersonReadDTO, CreateOutputDTO: PersonOutputDTO },
      { plainField: 'password', hashField: 'passwordHash', requireOnCreate: true }
    );
  }
}

module.exports = PersonServices;
