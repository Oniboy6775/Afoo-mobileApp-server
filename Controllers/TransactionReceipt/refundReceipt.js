const { v4: uuid } = require("uuid");
const Transaction = require("../../Models/transactionModel");
const User = require("../../Models/usersModel");
const refundReceipt = async (payload) => {
  if (payload.isOwner) {
    // receipt for  transaction owner
    const {
      trans_By,
      trans_Network,
      phone_number,
      trans_amount,
      balance: ownerBalance,
      isOwner,
    } = payload;
    const { userName } = await User.findOne({ _id: trans_By });
    const newTransaction = Transaction({
      trans_Id: uuid(),
      trans_By: trans_By,
      trans_Type: "refund",
      trans_Network: `Refund for ${trans_Network}`,
      phone_number: phone_number,
      trans_amount: trans_amount,
      balance_Before: ownerBalance,
      trans_UserName: userName,
      balance_After: ownerBalance + trans_amount,
      trans_Date: `${new Date().toDateString()} ${new Date().toLocaleTimeString()}`,
      trans_Status: "success",
      trans_profit: 0,
      trans_volume_ratio: 0,
      createdAt: Date.now(),
    });

    const receipt = await newTransaction.save();
    return receipt;
  } else {
    // receipt for sponsor transaction
    const {
      trans_amount,
      phone_number,
      sponsorBalance,
      trans_Network,
      sponsorId,
      userName,
      bonus,
    } = payload;

    const newTransaction = Transaction({
      trans_Id: uuid(),
      trans_By: sponsorId,
      trans_Type: "refund",
      trans_Network: "charge-back",
      phone_number: `charge back for ${trans_Network} from ${userName}`,
      trans_amount: bonus,
      balance_Before: sponsorBalance,
      balance_After: sponsorBalance - bonus,
      trans_Date: `${new Date().toDateString()} ${new Date().toLocaleTimeString()}`,
      trans_Status: "success",
      createdAt: Date.now(),
    });

    const receipt = await newTransaction.save();
    return receipt;
  }
};
module.exports = refundReceipt;
