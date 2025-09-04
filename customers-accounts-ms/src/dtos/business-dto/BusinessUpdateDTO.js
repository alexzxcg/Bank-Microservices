class BusinessUpdateDTO {
  constructor(body) {
    this.name = body.name;
    this.birthDate = body.birthDate;
    this.phone = body.phone;
    this.street = body.street;
    this.number = body.number;
    this.district = body.district;
    this.city = body.city;
    this.state = body.state;
    this.zipCode = body.zipCode;
    this.isIcmsExempt = body.isIcmsExempt;
    this.stateRegistration = body.stateRegistration;
  }
}

module.exports = BusinessUpdateDTO;
