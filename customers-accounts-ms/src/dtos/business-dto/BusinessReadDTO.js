class BusinessReadDTO {
  constructor(customerAggregate) {
    const c = customerAggregate;

    this.id = c.id;
    this.type = c.type;
    this.name = c.name;
    this.email = c.email;
    this.birthDate = c.birthDate;
    this.phone = c.phone;
    this.address = {
      street: c.street,
      number: c.number,
      district: c.district,
      city: c.city,
      state: c.state,
      zipCode: c.zipCode,
    };
    this.business = c.business
      ? {
          cnpj: c.business.cnpj,
          isIcmsExempt: c.business.isIcmsExempt,
          stateRegistration: c.business.stateRegistration,
        }
      : null;
  }
}

module.exports = BusinessReadDTO;
