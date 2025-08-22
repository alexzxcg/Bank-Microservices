const { Router } = require('express');
const validate = require('../middlewares/validation/validateFactory');
const authenticate = require('../middlewares/auth/authenticate');
const { authorizeRoles } = require('../middlewares/auth/authorize');
const { authorizeByParamId } = require('../middlewares/auth/authorizeByParamId');

const { personCreateSchema } = require('../middlewares/validation/schemas/personCreateSchema');
const { personUpdateSchema } = require('../middlewares/validation/schemas/personUpdateSchema');
const PersonController = require('../controllers/PersonController');

const router = Router();
const controller = new PersonController();

router.post('/persons', validate(personCreateSchema), controller.create);

// Somente ADMIN pode listar todos
router.get('/persons', authenticate, authorizeRoles('ADMIN'), controller.getAll);

// Dono ou ADMIN pode ver/atualizar/remover por id
router.get('/persons/:id', authenticate, authorizeByParamId('id'), controller.getById);
router.put('/persons/:id', authenticate, authorizeByParamId('id'), validate(personUpdateSchema), controller.update);
router.delete('/persons/:id', authenticate, authorizeRoles('ADMIN'), controller.remove);

module.exports = router;
