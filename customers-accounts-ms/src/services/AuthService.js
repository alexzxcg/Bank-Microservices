const jwt = require('jsonwebtoken');
const AuthRepository = require('../repositories/AuthRepository');
const { comparePassword } = require('../utils/password');
const { AppError } = require('../middlewares/error/errorHandler');
const { JWT_SECRET, JWT_EXPIRES, JWT_ISS } = require('../config/env');

class AuthService {
  async authenticate({ email, password }) {
    const customer = await AuthRepository.findByEmail(email);
    if (!customer) throw new AppError('Invalid credentials', 401);

    const ok = await comparePassword(password, customer.passwordHash);
    if (!ok) throw new AppError('Invalid credentials', 401);

    const token = jwt.sign(
      {
        sub: String(customer.id),
        email: customer.email,
        type: customer.type,
        iss: JWT_ISS,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return { token, expiresIn: JWT_EXPIRES, customer };
  }
}

module.exports = AuthService;
