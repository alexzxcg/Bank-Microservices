const Controller = require('./Controller');
const BusinessServices = require('../services/BusinessServices');
const BusinessInputDTO = require('../dtos/business-dto/BusinessInputDTO');
const BusinessUpdateDTO = require('../dtos/business-dto/BusinessUpdateDTO');

class BusinessController extends Controller {
  constructor() {
    super(new BusinessServices(), { CreateDTO: BusinessInputDTO, UpdateDTO: BusinessUpdateDTO });
  }
}

module.exports = BusinessController;
