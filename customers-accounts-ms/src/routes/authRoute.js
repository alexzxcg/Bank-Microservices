const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const validate = require('../middlewares/validation/validateFactory');
const { loginSchema } = require('../middlewares/validation/schemas/loginSchema');

const router = Router();
const controller = new AuthController();

router.post('/auth/login', validate(loginSchema), controller.login);

module.exports = router;
