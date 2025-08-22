const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const validate = require('../middlewares/validation/validateFactory');
const yup = require('yup');

const router = Router();
const controller = new AuthController();

const loginSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required(),
});

router.post('/auth/login', validate(loginSchema), controller.login);

module.exports = router;
