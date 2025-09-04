const AuthSubjectServices = require('./_shared/AuthSubjectServices');
const PersonRepository = require('../repositories/PersonRepository');

const PersonOutputDTO = require('../dtos/person-dto/PersonOutputDTO');
const PersonReadDTO = require('../dtos/person-dto/PersonReadDTO');

class PersonServices extends AuthSubjectServices {
  constructor() {
    super(
      new PersonRepository(),
      { ReadDTO: PersonReadDTO, CreateOutputDTO: PersonOutputDTO },
      { plainField: 'password', hashField: 'passwordHash', requireOnCreate: true }
    );
  }

  async beforeDelete(id, ctx = {}) {
    await this.repository.findById(id, ctx);
  }
}

module.exports = PersonServices;
