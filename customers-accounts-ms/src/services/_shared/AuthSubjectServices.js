const Services = require('../Services');
const { hashPassword } = require('../../utils/password');
const { AppError } = require('../../middlewares/error/errorHandler');

class AuthSubjectServices extends Services { 
  constructor(repository, { ReadDTO = null, CreateOutputDTO = null } = {}, {
    plainField = 'password',
    hashField = 'passwordHash',
    requireOnCreate = true
  } = {}) {
    super(repository, { ReadDTO, CreateOutputDTO });
    this._plainField = plainField;
    this._hashField = hashField;
    this._requireOnCreate = requireOnCreate;
  }

  async beforeCreate(data, ctx) {
    if (this._requireOnCreate && !data[this._plainField]) {
      throw new AppError(`${this._plainField} is required`, 400);
    }
    if (data[this._plainField]) {
      await this._hashAndSwap(data);
    }
  }

  async beforeUpdate(id, data, ctx) {
    if (data[this._plainField]) {
      await this._hashAndSwap(data);
    }
  }

  async _hashAndSwap(data) {
    data[this._hashField] = await hashPassword(data[this._plainField]);
    delete data[this._plainField];
  }
}

module.exports = AuthSubjectServices;
