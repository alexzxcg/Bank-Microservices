class AccountReadDTO {
  constructor(account) {
    this.id = account.id;
    this.number = account.number;
    this.branch = account.branch;
    this.type = account.type;
    this.balance = account.balance;
    this.active = account.active;
  }
}

module.exports = AccountReadDTO;
