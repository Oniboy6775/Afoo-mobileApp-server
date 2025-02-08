const Transaction = require("../Models/transactionModel");
const { v4: uuid } = require("uuid");
const Receipt = async (payload) => {
  const {
    transactionId,
    planNetwork,
    status,
    planName,
    phoneNumber,
    amountToCharge,
    balance,
    userId,
    userName,
    type,
    costPrice,
    volumeRatio,
    response,
    increased,
    wavedAmount,
    planType,
  } = payload;
  let totalCost = costPrice * volumeRatio;
  if (planType == "AWOOF") totalCost = costPrice;
  const profit = parseInt(amountToCharge - totalCost);
  // console.log({ costPrice, volumeRatio, cost, profit });
  const newTransaction = Transaction({
    trans_Id: transactionId || uuid(),
    trans_By: userId,
    trans_UserName: userName,
    trans_Type: type,
    trans_Network: `${planNetwork} ${planName} `,
    phone_number: phoneNumber,
    trans_amount: amountToCharge,
    trans_profit: wavedAmount || profit || 0,
    trans_volume_ratio: volumeRatio && volumeRatio,
    balance_Before: balance,
    balance_After:
      increased === "none" //NO INCREASE NOR DECREASE
        ? balance
        : increased
        ? balance + amountToCharge
        : balance - amountToCharge,
    apiResponse: response && response,
    trans_Date: `${new Date().toDateString()} ${new Date().toLocaleTimeString()}`,
    trans_Status: status,
    createdAt: Date.now(),
  });

  const receipt = await newTransaction.save();
  return receipt;
};
module.exports = Receipt;
