const Controller = require('./Controller');
const PersonServices = require('../services/PersonServices');
const PersonInputDTO = require('../dtos/person-dto/PersonInputDTO');
const PersonUpdateDTO = require('../dtos/person-dto/PersonUpdateDTO');

class PersonController extends Controller {
  constructor() {
    super(new PersonServices(), { CreateDTO: PersonInputDTO, UpdateDTO: PersonUpdateDTO });
  }
}

module.exports = PersonController;
