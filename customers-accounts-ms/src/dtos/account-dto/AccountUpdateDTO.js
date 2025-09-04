class AccountUpdateDTO {
  constructor({ customerId, type }) {
    this.customerId = customerId;           
    this.type = type;      
  }
}
module.exports = AccountUpdateDTO;