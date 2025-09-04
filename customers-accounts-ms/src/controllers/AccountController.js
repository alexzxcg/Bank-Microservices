const Controller = require('./Controller.js');
const { asyncHandler } = require('../middlewares/error/errorHandler.js');

const AccountServices = require('../services/AccountServices.js');
const AccountInputDTO = require('../dtos/account-dto/AccountInputDTO.js');
const AccountUpdateDTO = require('../dtos/account-dto/AccountUpdateDTO.js');
const AccountBalanceDTO = require('../dtos/account-dto/AccountBalanceDTO.js');

class AccountController extends Controller {
  constructor() {
    super(new AccountServices(), {
      CreateDTO: AccountInputDTO,  
      UpdateDTO: AccountUpdateDTO, 
    });
  }

  findByAccountNumber = asyncHandler(async (req, res) => {
    const ctx = this.buildCtx(req);
    const { accountNumber } = req.params;
    const account = await this.entityService.findByNumber(accountNumber, ctx);
    return res.status(200).json(account);
  });

  changeBalance = asyncHandler(async (req, res) => {
    const ctx = this.buildCtx(req);
    const { accountId } = req.params;
    const balanceDTO = new AccountBalanceDTO(req.body.balance);
    const result = await this.entityService.changeBalance(Number(accountId), balanceDTO.balance, ctx);
    return res.status(200).json(result);
  });

  findAll = asyncHandler(async (req, res) => {
    const ctx = this.buildCtx(req);
    const customerId = Number(req.params.myId);
    const list = await this.entityService.findAll(customerId, ctx);
    return res.status(200).json(list);
  });

  findById = asyncHandler(async (req, res) => {
    const ctx = this.buildCtx(req);
    const customerId = Number(req.params.myId);
    const accountId = Number(req.params.accountId);
    const record = await this.entityService.findById(accountId, customerId, ctx);
    return res.status(200).json(record);
  });

  create = asyncHandler(async (req, res) => {
    const ctx = this.buildCtx(req);
    const customerId = Number(req.params.myId);
    const dto = new this.CreateDTO({ customerId, type: req.body.type });
    const created = await this.entityService.create(dto, ctx); 
    return res.status(201).json(created);
  });

  update = asyncHandler(async (req, res) => {
    const ctx = this.buildCtx(req);
    const customerId = Number(req.params.myId);
    const accountId = Number(req.params.accountId);
    const dto = new this.UpdateDTO({ type: req.body.type });
    const updated = await this.entityService.update(dto, accountId, customerId, ctx);
    return res.status(200).json(updated);
  });

  delete = asyncHandler(async (req, res) => {
    const ctx = this.buildCtx(req);
    const customerId = Number(req.params.myId);
    const accountId = Number(req.params.accountId);
    await this.entityService.delete(accountId, customerId, ctx);
    return res.status(200).json({ message: `Account ${accountId} deleted` });
  });
}

module.exports = AccountController;
