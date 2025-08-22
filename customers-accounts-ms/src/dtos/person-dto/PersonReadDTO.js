class PersonReadDTO {
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
    this.person = c.person
      ? {
          cpf: c.person.cpf,
          monthlyIncome: c.person.monthlyIncome,
        }
      : null;
  }
}

module.exports = PersonReadDTO;
