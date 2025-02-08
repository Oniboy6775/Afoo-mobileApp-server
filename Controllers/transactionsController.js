const Transaction = require("../Models/transactionModel");
const Users = require("../Models/usersModel");

const searchTransaction = async (req, res) => {
  const {
    type,
    phoneNumber,
    transactionId,
    sort,
    userName,
    from,
    to,
    status,
    supplier,
    id,
  } = req.query;
  const { AGENT_1, AGENT_2, AGENT_3, ADMIN_ID } = process.env;
  const agents = [AGENT_1, AGENT_2, AGENT_3];
  const isAgent = agents.find((e) => e === req.user.userId) === req.user.userId;
  let isAdmin = ADMIN_ID === req.user.userId;

  let queryObject = {};
  if (!isAdmin && !isAgent) {
    queryObject = { trans_By: req.user.userId };
  }
  // type of transaction
  if (type && type !== "all") {
    const splittedType = type.split(",");
    queryObject.trans_Type = { $in: splittedType };
  }
  if (supplier && supplier !== "all") {
    queryObject.trans_supplier = supplier;
  }
  if (phoneNumber) {
    // filter with phone number
    queryObject.phone_number = { $regex: phoneNumber, $options: "i" };
  }
  if (transactionId) {
    queryObject.trans_Id = transactionId;
  }

  // filter with transaction status
  if (status && status !== "all") {
    queryObject.trans_Status = { $regex: status, $options: "i" };
  }
  //  filter with userId
  // if (userName && userId) {
  //   queryObject.trans_By = userId;
  // }
  if (userName) {
    // queryObject.trans_UserName = userAccount;
    queryObject.trans_UserName = { $regex: userName, $options: "i" };
  }
  // if (userName) {
  //   query.trans_By = userId;
  // }
  if (from) {
    queryObject.createdAt = { $gte: from, $lt: to || new Date() };
  }

  let result = Transaction.find(queryObject);

  if (!isAdmin) result.select("-trans_profit -trans_supplier");
  if (sort) {
    const sortList = sort.split(",").join(" ");
    result = result.sort(sortList);
  } else {
    result = result.sort("-createdAt");
  }

  // Fetch transactions for the selected day to calculate no of GB sold

  let start = from ? from : new Date().setHours(-1, -1, -1, -1);
  let end = to ? to : new Date().setHours(23, 59, 59, 999);

  let query = {
    createdAt: { $gte: start, $lt: end },
  };
  if (!isAdmin && !isAgent) {
    query.trans_By = req.user.userId;
  }

  // let totalDebit = calculateMoneyFlow("DEBIT");
  // let totalCredit = calculateMoneyFlow("CREDIT");
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || (isAdmin || isAgent ? 100 : 30);
  const skip = (page - 1) * limit;
  result = await result.skip(skip).limit(limit);
  let noOfTransaction = await Transaction.countDocuments(queryObject);
  const totalPages = Math.ceil(noOfTransaction / limit);
  res.status(200).json({
    totalPages,
    transactions: result,
    stat: isAdmin ? [] : [],
    totalSales: 0,
    totalProfit: 0,
    totalDebit: 0,
    totalCredit: 0,
  });
};
module.exports = searchTransaction;
