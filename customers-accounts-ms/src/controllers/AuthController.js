const jwt = require('jsonwebtoken');
const { Customer } = require('../models');
const { comparePassword } = require('../utils/password');
const { JWT_SECRET, JWT_EXPIRES, JWT_ISS } = require('../../src/config/env');
const { AppError, asyncHandler } = require('../middlewares/error/errorHandler');

class AuthController {
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const customer = await Customer.findOne({ where: { email } });
    if (!customer) throw new AppError('Invalid credentials', 401);

    const ok = await comparePassword(password, customer.passwordHash);
    if (!ok) throw new AppError('Invalid credentials', 401);

    const token = jwt.sign(
      {
        sub: String(customer.id),
        email: customer.email,
        type: customer.type, // PERSON | BUSINESS | ADMIN
        iss: JWT_ISS,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.status(200).json({
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: JWT_EXPIRES,
      user: {
        id: customer.id,
        type: customer.type,
        name: customer.name,
        email: customer.email,
      },
    });
  });
}

module.exports = AuthController;
