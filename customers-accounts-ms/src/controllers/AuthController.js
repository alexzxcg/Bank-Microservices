const { asyncHandler } = require('../middlewares/error/errorHandler');
const AuthService = require('../services/AuthService');
const LoginDTO = require('../dtos/login-dto/LoginInputDTO');
const LoginOutputDTO = require('../dtos/login-dto/LoginOutputDTO');

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  login = asyncHandler(async (req, res) => {
    const dto = new LoginDTO(req.body);
    const result = await this.authService.authenticate(dto);
    const output = new LoginOutputDTO(result);
    return res.status(200).json(output);
  });
}

module.exports = AuthController;
