const { Router } = require('express');
const validate = require('../middlewares/validation/validateFactory');
const authenticate = require('../middlewares/auth/authenticate');
const { authorizeRoles } = require('../middlewares/auth/authorize');
const { authorizeByParamId } = require('../middlewares/auth/authorizeByParamId');

const { businessCreateSchema } = require('../middlewares/validation/schemas/businessCreateSchema');
const { businessUpdateSchema } = require('../middlewares/validation/schemas/businessUpdateSchema');

const BusinessController = require('../controllers/BusinessController');
const router = Router();
const controller = new BusinessController();

router.post('/businesses', validate(businessCreateSchema), controller.create);

// Somente ADMIN pode listar todos
router.get('/businesses', authenticate, authorizeRoles('ADMIN'), controller.getAll);

// Dono ou ADMIN pode ver/atualizar/remover por id
router.get('/businesses/:id', authenticate, authorizeByParamId('id'), controller.getById);
router.put('/businesses/:id', authenticate, authorizeByParamId('id'), validate(businessUpdateSchema), controller.update);
router.delete('/businesses/:id', authenticate, authorizeRoles('ADMIN'), controller.remove);

module.exports = router;
