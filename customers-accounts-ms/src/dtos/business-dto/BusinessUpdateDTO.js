class BusinessUpdateDTO {
  constructor(body) {
    this.name = body.name;
    this.email = body.email;
    this.birthDate = body.birthDate;
    this.phone = body.phone;
    this.street = body.street;
    this.number = body.number;
    this.district = body.district;
    this.city = body.city;
    this.state = body.state;
    this.zipCode = body.zipCode;
    this.cnpj = body.cnpj;
    this.isIcmsExempt = body.isIcmsExempt;
    this.stateRegistration = body.stateRegistration;
  }
}

module.exports = BusinessUpdateDTO;
