const { v4: uuid } = require("uuid");
const Transaction = require("../../Models/transactionModel");
const dataReceipt = async (payload) => {
  const {
    id,
    plan_network,
    Status,
    plan_name,
    mobile_number,
    amountToCharge,
    balance,
    userId,
    userName,
  } = payload;

  const newTransaction = Transaction({
    trans_Id: uuid(),
    trans_By: userId,
    trans_UserName: userName,
    trans_Type: "data",
    trans_Network: `${plan_network} ${plan_name} `,
    phone_number: mobile_number,
    trans_amount: amountToCharge,
    balance_Before: balance,
    balance_After: balance - amountToCharge,
    trans_Date: `${new Date().toDateString()} ${new Date().toLocaleTimeString()}`,
    trans_Status: Status,
    createdAt: Date.now(),
  });

  const receipt = await newTransaction.save();
  return receipt;
};
module.exports = dataReceipt;
