const User = require("../Models/usersModel");
const {
  AIRTIME_RECEIPT,
  DATA_RECEIPT,
  ELECETRICITY_RECEIPT,
} = require("./TransactionReceipt");
const Data = require("../Models/dataModel");
const generateReceipt = require("./generateReceipt");
const CostPrice = require("../Models/costPriceModel");
const { v4: uuid } = require("uuid");
const BUYELECTRICITY = require("./APICALLS/Electricity/electricity");

const BUYAIRTIME = require("./APICALLS/Airtime/buyAirtime");
const BUYDATA = require("./APICALLS/Data/Data");
const { default: axios } = require("axios");
const { disco } = require("../API_DATA/disco");
const getStatusCode = require("../Utils/statusCodeMapping");

const buyAirtime = async (req, res) => {
  const {
    user: { userId, userType },
    body: { mobile_number, amount, network },
  } = req;
  // Tesing Phase
  const isTest = process.env.TEST_MODE === "true";
  const isReseller = userType === "reseller";
  const isApiUser = userType === "api user";
  let amountToCharge = amount * 0.99;
  if (isReseller || isApiUser) amountToCharge = amount * 0.99;
  const user = await User.findById(userId);
  if (!mobile_number || !amount || !network)
    return res.status(400).json({ msg: "All fields are required" });
  if (amount < 100)
    return res.status(400).json({ msg: "Minimum purchase is 100" });

  let NETWORK = "";
  if (network == "1") NETWORK = "MTN";
  if (network == "2") NETWORK = "GLO";
  if (network == "3") NETWORK = "AIRTEL";
  if (network == "4") NETWORK = "9MOBILE";

  // If isTest is true, skip balance check and API call
  if (isTest) {
    const transactionId = uuid();
    const payload = {
      transactionId,
      planNetwork: NETWORK,
      status: "success",
      planName: amount,
      phoneNumber: mobile_number,
      amountToCharge,
      balance: user.balance,
      userId,
      userName: user.userName,
      type: "airtime",
      apiResponseId: "test-" + transactionId,
      apiResponse: "Test transaction - no actual airtime purchased",
      isTest: true,
    };
    const receipt = await generateReceipt(payload);

    return res.status(200).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: `Test ${NETWORK} airtime purchase successful2`,
      data: { ...receipt._doc },
    });
  }

  // Regular flow for non-test transactions
  const { balance } = user;
  if (balance < amountToCharge || balance - amountToCharge < 0)
    return res
      .status(400)
      .json({ msg: "Insufficient balance. Kindly fund your wallet" });

  // Deduct balance based on status (i.e should come after successful transaction)
  await User.updateOne({ _id: userId }, { $inc: { balance: -amountToCharge } });
  const { status, msg, apiResponseId, apiResponse } = await BUYAIRTIME({
    network,
    amount,
    mobile_number,
  });

  if (status) {
    const transactionId = uuid();
    const payload = {
      transactionId,
      planNetwork: NETWORK,
      status: "success",
      planName: amount,
      phoneNumber: mobile_number,
      amountToCharge,
      balance,
      userId,
      userName: user.userName,
      type: "airtime",
      apiResponseId,
      apiResponse,
    };
    const receipt = await generateReceipt(payload);
    res.status(200).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg,
      data: { ...receipt._doc },
    });
  } else {
    await User.updateOne(
      { _id: userId },
      { $inc: { balance: +amountToCharge } }
    );
    return res.status(500).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: msg || "Transaction failed",
    });
  }
};
const buyData = async (req, res) => {
  const {
    user: { userId, userType },
    body: { plan, mobile_number, network },
  } = req;

  // Tesing Phase
  const isTest = process.env.TEST_MODE === "true";
  const isReseller = userType === "reseller";
  const isApiUser = userType === "api user";
  if (!plan || !mobile_number || !network)
    return res.status(400).json({ msg: "All fields are required" });
  const user = await User.findOne({ _id: userId });
  const dataTobuy = await Data.findOne({ id: plan });
  if (!dataTobuy)
    return res.status(400).json({ msg: "This data is not available" });
  const {
    resellerPrice,
    partnerPrice,
    apiPrice,
    plan_type,
    my_price,
    plan: dataVolume,
    volumeRatio,
    planCostPrice,
    isAvailable,
    plan_network,
  } = dataTobuy;
  if (!isAvailable)
    return res.status(400).json({
      msg: `${plan_network} ${plan_type} ${dataVolume} is currently unavailable. Try other plans `,
    });
  let amountToCharge = my_price;
  if (isReseller || isApiUser) amountToCharge = resellerPrice || my_price;

  let NETWORK = "";
  if (network == "1") NETWORK = "MTN";
  if (network == "2") NETWORK = "GLO";
  if (network == "3") NETWORK = "AIRTEL";
  if (network == "6") NETWORK = "9MOBILE";

  // If isTest is true, skip balance check and API call
  if (isTest) {
    const transactionId = uuid();
    const receipt = await generateReceipt({
      transactionId,
      planNetwork: NETWORK,
      planName: `${plan_type} ${dataVolume}`,
      phoneNumber: mobile_number,
      status: "success",
      amountToCharge,
      balance: user.balance,
      userId,
      userName: user.userName,
      type: "data",
      volumeRatio: volumeRatio,
      costPrice: planCostPrice || amountToCharge,
      response: "Test transaction - no actual data purchased",
      planType: plan_type,
      apiResponseId: transactionId,
      apiResponse: "Test transaction - no actual data purchased",
    });
    return res.status(200).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: `Test ${NETWORK} data purchase successful`,
      data: { ...receipt._doc },
    });
  }

  // Regular flow for non-test transactions
  const { balance } = user;
  if (balance < amountToCharge || balance - amountToCharge < 0)
    return res
      .status(400)
      .json({ msg: "Insufficient balance. Kindly fund your wallet" });
  await User.updateOne({ _id: userId }, { $inc: { balance: -amountToCharge } });
  let message;
  let receipt = {};
  let isSuccess = false;

  // Checking the cost price of the data
  let { costPrice } = await CostPrice.findOne({ network: NETWORK });
  if (NETWORK === "MTN" && plan_type == "CG") {
    const { costPrice: CG_COST_PRICE } = await CostPrice.findOne({
      network: "MTN-CG",
    });
    costPrice = CG_COST_PRICE;
  }
  if (NETWORK === "MTN" && plan_type == "COUPON") {
    const { costPrice: COUPON_COST_PRICE } = await CostPrice.findOne({
      network: "MTN-COUPON",
    });
    costPrice = COUPON_COST_PRICE;
  }
  const { status, data, msg } = await BUYDATA({ ...req.body });

  isSuccess = status;
  if (status) {
    console.log({ ...data });
    receipt = await generateReceipt({
      transactionId: uuid(),
      planNetwork: NETWORK,
      planName: `${plan_type} ${dataVolume}`,
      phoneNumber: mobile_number,
      status: "success",
      amountToCharge,
      balance,
      userId,
      userName: user.userName,
      type: "data",
      volumeRatio: volumeRatio,
      costPrice: planCostPrice || costPrice * volumeRatio || amountToCharge,
      response: msg || "",
      planType: plan_type,
      ...data,
    });
  }
  if (isSuccess) {
    res.status(200).json({ msg, receipt });
  } else {
    await User.updateOne(
      { _id: userId },
      { $inc: { balance: +amountToCharge } }
    );
    return res.status(500).json({
      msg: msg || "Transaction failed",
    });
  }
};

// Data Subscription Plans
const dataPlans = async (req, res) => {
  const { network } = req.params;
  let NETWORK = "";
  if (network == "1") NETWORK = "MTN";
  if (network == "2") NETWORK = "GLO";
  if (network == "3") NETWORK = "AIRTEL";
  if (network == "4") NETWORK = "9MOBILE";
  try {
    if (!network)
      return res.status(400).json({ msg: "All fields are required" });
    const data = await Data.find({ plan_network: NETWORK });
    res.status(200).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: `Test ${NETWORK} data purchase successful`,
      data: { ...receipt._doc },
    });
  } catch (error) {
    res.status(500).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: "An error occur",
    });
  }
};
const validateMeter = async (req, res) => {
  const { meterNumber, meterId, meterType } = req.body;
  console.log({ ...req.body });
  if (!meterNumber && !meterId)
    return res.status(400).json({ msg: "All fields are required" });
  try {
    const ValidateMeterResponse = await axios.post(
      `${process.env.DATARELOADED_API}/buy/validateMeter`,
      { meterNumber, meterId, meterType },
      {
        headers: {
          Authorization: process.env.DATARELOADED_API_KEY,
        },
      }
    );
    // console.log(ValidateMeterResponse);
    const { invalid, name, address } = ValidateMeterResponse.data;
    console.log({ invalid, name, address });
    res.status(200).json({ name, address });
  } catch (error) {
    console.log(error.response.data);
    res.status(500).json({
      msg: error.response.data.name || "An error occur.Please try again later",
    });
  }
};

const validateCableTv = async (req, res) => {
  res.status(500).json({
    msg: "An error occur.Please try again later",
  });
};

const buyElectricity = async (req, res) => {
  const { meterId, meterNumber, amount, meterType } = req.body;
  const { userId, userType } = req.user;
  const amountToCharge = parseFloat(amount) + 50;
  if (!meterId || !meterNumber || !amount || !meterType) {
    console.log(req.body);
    return res.status(400).json({ msg: "All fields are required" });
  }
  const user = await User.findById(userId);
  const { balance } = user;

  // if (amount < 1000)
  //   return res.status(400).json({ msg: "minimum purchase is 1000" });
  if (balance < amountToCharge || balance - amountToCharge < 0)
    return res
      .status(400)
      .json({ msg: "Insufficient balance. Kindly fund your wallet" });
  // Charging the user
  await User.updateOne({ _id: userId }, { $inc: { balance: -amountToCharge } });

  const response = await BUYELECTRICITY({ ...req.body });
  const { status, token, msg } = response;
  if (status) {
    const receipt = await ELECETRICITY_RECEIPT({
      package: "electricity token",
      Status: "success",
      token: token,
      meter_number: meterNumber,
      amountToCharge,
      balance,
      userId,
    });
    res.status(200).json({ msg: msg, receipt });
  } else {
    // return the charged amount
    await User.updateOne(
      { _id: userId },
      { $inc: { balance: amountToCharge } }
    );
    res.status(500).json({ msg: msg || "Transaction failed" });
  }
};
const buyCableTv = async (req, res) => {
  return res.status(400).json({ msg: "Not available at the moment" });
};
module.exports = {
  buyAirtime,
  buyData,
  buyElectricity,
  buyCableTv,
  validateCableTv,
  validateMeter,
  dataPlans,
};
