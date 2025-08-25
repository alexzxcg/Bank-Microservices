class LoginOutputDTO {
  constructor({ token, expiresIn, customer }) {
    this.accessToken = token;
    this.tokenType = 'Bearer';
    this.expiresIn = expiresIn;
    this.user = {
      id: customer.id,
      type: customer.type,
      name: customer.name,
      email: customer.email,
    };
  }
}
module.exports = LoginOutputDTO;
