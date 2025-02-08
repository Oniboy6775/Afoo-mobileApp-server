const BankCodes = require("../Models/bankCodeModel");
const User = require("../Models/usersModel");
const axios = require("axios");
const generateReceipt = require("./generateReceipt");
const Transactions = require("../Models/transactionModel");
const Beneficiary = require("../Models/beneficiaryModel");
const { v4: uuid } = require("uuid");

const allBankCodes = async (req, res) => {
  try {
    let allCodes = await BankCodes.find().select("bankName");
    allCodes = allCodes.map((e) => e.bankName);
    res.status(200).json(allCodes);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "something went wrong" });
  }
};
const validateAccountNumber = async (req, res) => {
  const { VPAY_API_URL, VPAY_USERNAME, VPAY_PASSWORD, VPAY_PUBLIC_KEY } =
    process.env;
  const { accountNumber, bankName } = req.body;

  try {
    const bankDetails = await BankCodes.findOne({ bankName });
    if (!bankDetails)
      return res.status(400).json({ msg: "account details not found" });
    const { bankCode } = bankDetails;
    console.log(bankCode);
    const authFetch = axios.create({
      baseURL: VPAY_API_URL,
    });
    const response = await authFetch.post(
      "/api/service/v1/query/merchant/login",
      { username: VPAY_USERNAME, password: VPAY_PASSWORD },
      { headers: { publicKey: VPAY_PUBLIC_KEY } }
    );
    const token = response.data.token;

    const accountDetails = await authFetch.post(
      "/api/service/v1/query/lookup/nuban",
      {
        nuban: accountNumber,
        bank_code: bankCode,
      },
      { headers: { publicKey: VPAY_PUBLIC_KEY, "b-access-token": token } }
    );
    console.log(accountDetails.data);
    if (!accountDetails.data.data) {
      return res.status(400).json({ msg: " account validation failed" });
    }
    res.status(200).json({
      msg: accountDetails.data.data.message,
      name: accountDetails.data.data.data.name,
      code: bankCode,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ msg: "Account verification failed. Try again in 5minutes" });
  }
};

const withdraw = async (req, res) => {
  const { accountNumber, amount, bankName, bankCode, bankAccountName } =
    req.body;
  const { userId } = req.user;
  const transactionId = uuid();
  if (!accountNumber || !amount || !bankName || !bankCode || !bankAccountName)
    return res.status(400).json({
      msg: "All fields are required",
    });
  const { balance, userName, _id, bvn, nin } = await User.findOne({
    _id: userId,
  });
  if (!bvn && !nin) {
    return res.status(400).json({
      msg: "Kindly Do Your KYC and retry",
    });
  }
  try {
    const { VPAY_API_URL, VPAY_USERNAME, VPAY_PASSWORD, VPAY_PUBLIC_KEY } =
      process.env;
    if (amount < 500) {
      return res.status(400).json({
        msg: "minimum withdrawal is ₦500",
      });
    }
    if (balance <= amount)
      return res.status(400).json({
        msg: "must have a minimum of ₦50 in your wallet after withdrawal",
      });
    const amountToCredit = amount - 50;
    if (amountToCredit > 2000)
      return res.status(400).json({
        msg: "maximum of ₦2000 can be withdrawn per transaction",
      });
    await User.updateOne({ _id: userId }, { $inc: { balance: -amount } });

    await generateReceipt({
      transactionId,
      planNetwork: "withdrawal",
      status: "pending",
      planName: `to ${bankName}`,
      phoneNumber: `${bankAccountName} ${accountNumber}`,
      amountToCharge: amount,
      balance,
      userId,
      userName,
      type: "wallet",
    });

    const authFetch = axios.create({
      baseURL: VPAY_API_URL,
    });
    const response = await authFetch.post(
      "/api/service/v1/query/merchant/login",
      { username: VPAY_USERNAME, password: VPAY_PASSWORD },
      { headers: { publicKey: VPAY_PUBLIC_KEY } }
    );
    const token = response.data.token;

    //  INTERBANK TRANSFER
    const { data } = await authFetch.post(
      "/api/service/v1/query/transfer/outbound",
      {
        nuban: accountNumber,
        bank_code: bankCode,
        amount: amountToCredit,
        remark: "withdrawal",
        transaction_ref: `abdul553-DataReloaded-withdrawal${transactionId}`,
      },
      { headers: { publicKey: VPAY_PUBLIC_KEY, "b-access-token": token } }
    );
    console.log(data);
    //     {
    // [0]   status: true,
    // [0]   data: {
    // [0]     status: '00',
    // [0]     message: '1689783452361',
    // [0]     data: {
    // [0]       txnId: 'v1-vpay-91793fd8-f03a-4271-88c2-b63114991083',
    // [0]       sessionId: '090110230719171731350888502085',
    // [0]       reference: '13711689783451981'
    // [0]     }
    // [0]   }
    // [0] }
    // update success receipt on success
    await Transactions.updateOne(
      { trans_Id: transactionId },
      {
        $set: {
          trans_Status: "success",
          apiResponseId: data.data.data.txnId,
          apiResponse: data.data.data.sessionId,
        },
      }
    );
    res.status(200).json({ msg: "withdrawal successful" });
  } catch (error) {
    let isError = error.response.data.message
      ? error.response.data.message
      : "An error occur";
    await Transactions.updateOne(
      { trans_Id: transactionId },
      {
        $set: {
          trans_Status: "failed",
          apiResponseId: transactionId,
          balance_After: balance,
        },
      }
    );
    await User.updateOne({ _id: userId }, { $inc: { balance: amount } });
    return res.status(500).json({ msg: isError });
  }
};
const addBeneficiary = async (req, res) => {
  const { userId } = req.user;
  const { bankName, bankCode, accountNumber, accountName } = req.body;
  if (!bankName || !bankCode || !accountNumber || !accountName)
    return res.status(400).json({ msg: "all fields are required" });

  try {
    const { _id } = await User.findById(userId);
    const totalContact = await Beneficiary.countDocuments({ userId: _id });
    if (totalContact >= 1)
      return res.status(400).json({ msg: "You can only add one beneficiary " });
    // creating the beneficiary
    await Beneficiary.create({ userId: _id, ...req.body });
    res.status(201).json({ msg: "Beneficiary added" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "something went wrong" });
  }
};
const fetchBeneficiary = async (req, res) => {
  const { userId } = req.user;
  try {
    const { _id } = await User.findById(userId);
    const beneficiaryList = await Beneficiary.find({ userId: _id }).sort(
      "-createdAt"
    );
    res.status(200).json({ msg: "Beneficiary list fetched", beneficiaryList });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "something went wrong" });
  }
};
module.exports = {
  allBankCodes,
  validateAccountNumber,
  withdraw,
  addBeneficiary,
  fetchBeneficiary,
};
