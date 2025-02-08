require("dotenv").config();
const { v4: uuid } = require("uuid");

const { default: axios } = require("axios");
const generateReceipt = require("../../Controllers/generateReceipt");
const autoTransfer = async ({ accountNumber, bankCode, amount, oldBal }) => {
  const transactionId = uuid();

  const {
    ADMIN_ID,
    VPAY_API_URL,
    VPAY_PASSWORD,
    VPAY_PUBLIC_KEY,
    VPAY_USERNAME,
  } = process.env;
  try {
    const authFetch = axios.create({
      baseURL: VPAY_API_URL,
    });
    const response = await authFetch.post(
      "/api/service/v1/query/merchant/login",
      { username: VPAY_USERNAME, password: VPAY_PASSWORD },
      { headers: { publicKey: VPAY_PUBLIC_KEY } }
    );
    const token = response.data.token;

    await generateReceipt({
      transactionId,
      planNetwork: "wallet",
      status: "pending",
      planName: `to ${accountNumber}`,
      phoneNumber: `onisabi abdullahi ${accountNumber}`,
      amountToCharge: amount,
      balance: oldBal,
      userId: ADMIN_ID,
      userName,
      type: "wallet",
    });
    //  INTERBANK TRANSFER
    const { data } = await authFetch.post(
      "/api/service/v1/query/transfer/outbound",
      {
        nuban: accountNumber,
        bank_code: bankCode,
        amount: amount,
        remark: "auto-transfer",
        transaction_ref: `abdul553-DataReloaded-withdrawal${transactionId}`,
      },
      { headers: { publicKey: VPAY_PUBLIC_KEY, "b-access-token": token } }
    );
    console.log(data);
    return {
      status: true,
    };
  } catch (error) {
    console.log(error);
    return { status: false, msg: "internal server error" };
  }
};

module.exports = autoTransfer;
// const result = autoTransfer({
//   accountNumber: "8108126121",
//   bankCode: "120001",
//   amount: 2000,
//   oldBal: 200,
// });
// console.log(result);
// let success = 0;

// while (success < 1) {
//   console.log("HERE");
// }
// setTimeout(() => {
//   console.log("Time up");
//   success = 1;
// }, 5000);
