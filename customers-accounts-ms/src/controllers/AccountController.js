const Controller = require('./Controller.js');
const AccountServices = require('../services/AccountServices.js');

const AccountInputDTO = require('../dtos/account-dto/AccountInputDTO.js');
const AccountUpdateDTO = require('../dtos/account-dto/AccountUpdateDTO.js');
const AccountBalanceDTO = require('../dtos/account-dto/AccountBalanceDTO.js');

const { asyncHandler } = require('../middlewares/error/errorHandler.js');

const accountServices = new AccountServices();

class AccountController extends Controller {
  constructor() {
    super(accountServices, { CreateDTO: AccountInputDTO, UpdateDTO: AccountUpdateDTO });
  }

  findByAccountNumber = asyncHandler(async (req, res) => {
    const account = await accountServices.findByNumber(req.params.accountNumber);
    return res.status(200).json(account); 
  });

  changeBalance = asyncHandler(async (req, res) => {
    const balanceDTO = new AccountBalanceDTO(req.body.balance);
    const result = await accountServices.changeBalance(req.params.accountId, balanceDTO.balance);
    return res.status(200).json(result); 
  });

  listMine = asyncHandler(async (req, res) => {
    const myId = Number(req.params.myId);
    const list = await accountServices.findAllByOwner(myId);
    return res.status(200).json(list); 
  });

  getMineById = asyncHandler(async (req, res) => {
    const myId = Number(req.params.myId);
    const accountId = Number(req.params.accountId);
    const acc = await accountServices.findOwnedById(myId, accountId);
    return res.status(200).json(acc); 
  });

  createMine = asyncHandler(async (req, res) => {
    const myId = Number(req.params.myId);
    const dto = new AccountInputDTO(req.body);
    const created = await accountServices.createOwned(myId, dto);
    return res.status(201).json(created);
  });

  updateMine = asyncHandler(async (req, res) => {
    const myId = Number(req.params.myId);
    const accountId = Number(req.params.accountId);
    const dto = new AccountUpdateDTO(req.body);
    const updated = await accountServices.updateOwned(myId, accountId, dto);
    return res.status(200).json(updated); 
  });

  removeMine = asyncHandler(async (req, res) => {
    const myId = Number(req.params.myId);
    const accountId = Number(req.params.accountId);
    await accountServices.deleteOwned(myId, accountId);
    return res.status(200).json({ message: `Account ${accountId} deleted` });
  });
}

module.exports = AccountController;
