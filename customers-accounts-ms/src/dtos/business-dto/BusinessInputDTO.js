class BusinessInputDTO {
  constructor(body) {
    this.type = 'BUSINESS';
    this.name = body.name;
    this.email = body.email;
    this.password = body.password;
    this.birthDate = body.birthDate ?? null;
    this.phone = body.phone ?? null;
    this.street = body.street ?? null;
    this.number = body.number ?? null;
    this.district = body.district ?? null;
    this.city = body.city ?? null;
    this.state = body.state ?? null;
    this.zipCode = body.zipCode ?? null;

    this.cnpj = body.cnpj;
    this.isIcmsExempt = body.isIcmsExempt;
    this.stateRegistration = body.stateRegistration ?? null;
  }
}

module.exports = BusinessInputDTO;
