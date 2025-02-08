const User = require("../Models/usersModel");
const { ELECETRICITY_RECEIPT } = require("./TransactionReceipt");
const Data = require("../Models/dataModel");
const { disco } = require("../API_DATA/disco");
const generateReceipt = require("./generateReceipt");
const axios = require("axios");
const BUYAIRTIME = require("./APICALLS/Airtime/buyAirtime");
const MTNDATA = require("./APICALLS/Data/mtn");
const NMOBILEDATA = require("./APICALLS/Data/9mobile");
const AIRTELDATA = require("./APICALLS/Data/airtel");
const GLODATA = require("./APICALLS/Data/glo");
const BUYELECTRICITY = require("./APICALLS/Electricity/buyElectricity");
const CostPrice = require("../Models/costPriceModel");
const { v4: uuid } = require("uuid");
const Transactions = require("../Models/transactionModel");
const servicesModel = require("../Models/servicesModel");
const checkContact = require("../Utils/checkContact");
const { referralBonus } = require("../Utils/referralBonus");
const { sendNotifications } = require("./pushNotificationController");
const pushNotificationModel = require("../Models/pushNotificationModel");
const { sendPushNotification } = require("../Utils/expo/notification");
const { autoSwitch } = require("../Utils/autoSwith/autoSwitch");
const sendWebhookPayload = require("../Utils/sendWebhookPayload");
const buyCable = require("./APICALLS/CableTv/buyCableTv");
const cabletvModel = require("../Models/cabletvModel");
const validateCable = require("./APICALLS/CableTv/validateCable");

const buyAirtime = async (req, res) => {
  const {
    user: { userId, userType },
    body: { mobile_number, amount, network },
  } = req;
  console.log(req.body);
  const isReseller = userType === "reseller";
  const isApiUser = userType === "api user";
  let amountToCharge = amount * 0.99;
  if (isReseller || isApiUser) amountToCharge = amount * 0.98;
  const user = await User.findById(userId);
  if (!mobile_number || !amount || !network)
    return res.status(400).json({ msg: "All fields are required" });
  if (amount < 100)
    return res.status(400).json({ msg: "Minimum purchase is 100" });
  const { balance } = user;
  if (balance < amountToCharge || balance - amountToCharge < 0)
    return res
      .status(400)
      .json({ msg: "Insufficient balance. Kindly fund your wallet" });

  let NETWORK = "";
  if (network == "1") NETWORK = "MTN";
  if (network == "2") NETWORK = "GLO";
  if (network == "3") NETWORK = "AIRTEL";
  if (network == "4") NETWORK = "9MOBILE";
  const { isAvailable, serviceType } = await servicesModel.findOne({
    serviceName: NETWORK,
    serviceType: "airtime",
  });
  if (!isAvailable)
    return res.status(400).json({
      msg: `${NETWORK} ${serviceType} is not available at the moment`,
    });
  // charging the user
  await User.updateOne({ _id: userId }, { $inc: { balance: -amountToCharge } });
  // generating receipt
  let transactionId = uuid();
  transactionId =
    `${new Date().getFullYear()}-AIRTIME-${transactionId}`.substring(0, 28);
  const payload = {
    transactionId,
    planNetwork: NETWORK,
    status: "processing",
    planName: amount,
    phoneNumber: mobile_number,
    amountToCharge,
    balance,
    userId,
    userName: user.userName,
    type: "airtime",
  };
  const receipt = await generateReceipt(payload);
  const { status, msg, apiResponseId, apiResponse, supplier } =
    await BUYAIRTIME({
      network,
      amount,
      mobile_number,
      transactionId,
    });
  checkContact({
    contactNumber: mobile_number,
    contactNetwork: NETWORK,
    userId: user._id,
  });
  if (status) {
    res.status(200).json({ msg: msg, apiResponseId, receipt });
    await Transactions.updateOne(
      { trans_Id: transactionId },
      {
        $set: {
          trans_Status: "success",
          apiResponseId,
          apiResponse: apiResponse || "",
          trans_supplier: supplier || "GLAD",
        },
      }
    );
    const pushTokenExit = await pushNotificationModel.findOne({
      userId,
      pushIsActive: true,
    });
    if (pushTokenExit) {
      sendPushNotification({
        title: "Purchase Successful",
        body: `Your purchase of ₦${amount} airtime to ${mobile_number} was successful`,
        pushTokens: [pushTokenExit.pushToken],
      });
    }
  } else {
    const pushTokenExit = await pushNotificationModel.findOne({
      userId,
      pushIsActive: true,
    });
    if (pushTokenExit) {
      sendPushNotification({
        title: "Purchase Failed",
        body: `Your purchase of ₦${amount} airtime to ${mobile_number} was not successful`,
        pushTokens: [pushTokenExit.pushToken],
      });
    }
    await User.updateOne(
      { _id: userId },
      { $inc: { balance: +amountToCharge } }
    );
    await Transactions.updateOne(
      { trans_Id: transactionId },
      {
        $set: {
          trans_Status: "failed",
          balance_After: balance,
          trans_profit: 0,
          trans_volume_ratio: 0,
        },
      }
    );
    return res.status(500).json({
      msg: msg || "Transaction failed",
    });
  }
  // send receipt to the user webhook url set by the user
  if (user.webhookUrl) {
    sendWebhookPayload({
      url: user.webhookUrl,
      transactionId,
    });
  }
};
const buyData = async (req, res) => {
  const {
    user: { userId, userType },
    body: { plan, mobile_number, network, loop },
  } = req;
  const isReseller = userType === "reseller";
  const isApiUser = userType === "api user";
  if (!plan || !mobile_number || !network)
    return res.status(400).json({ msg: "All fields are required" });
  const user = await User.findOne({ _id: userId });
  const { balance } = user;
  let NETWORK = "";
  if (network == "1") NETWORK = "MTN";
  if (network == "2") NETWORK = "GLO";
  if (network == "3") NETWORK = "AIRTEL";
  if (network == "6") NETWORK = "9MOBILE";
  const dataTobuy = await Data.findOne({ dataplan_id: plan });
  if (!dataTobuy)
    return res.status(400).json({ msg: "This data is not available" });
  // console.log(dataTobuy);
  const {
    resellerPrice,
    partnerPrice,
    apiPrice,
    plan_type,
    my_price,
    plan: dataVolume,
    volumeRatio,
    planCostPrice,
  } = dataTobuy;
  let amountToCharge = my_price;
  if (isReseller) amountToCharge = resellerPrice;
  if (isApiUser) amountToCharge = apiPrice;
  if (user.isSpecial && volumeRatio >= 1) {
    const product = `${NETWORK}-${plan_type}`;
    const specialPriceIndex = user.specialPrices.findIndex(
      (e) => e.productName === product
    );
    if (specialPriceIndex != -1) {
      amountToCharge =
        user.specialPrices[specialPriceIndex].price * volumeRatio;
    }
  }
  if (user.userName == "yangaplug" && plan_type == "AWOOF") {
    const specialCharge = {
      145: 196,
      146: 484,
      147: 1924,
    };
    amountToCharge = specialCharge[plan];
  }

  if (!amountToCharge)
    return res.status(400).json({ msg: "unable to charge user" });
  if (balance < amountToCharge || balance - amountToCharge < 0) {
    const response = isApiUser
      ? "Transaction failed contact admin"
      : "Insufficient balance. Kindly fund your wallet";
    return res.status(400).json({ msg: response });
  }

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
  if (NETWORK === "MTN" && plan_type == "SME2") {
    const { costPrice: SME2_COST_PRICE } = await CostPrice.findOne({
      network: "MTN-SME2",
    });
    costPrice = SME2_COST_PRICE;
  }
  if (NETWORK === "MTN" && plan_type == "DATA_TRANSFER") {
    const { costPrice: DATA_TRANSFER_COST_PRICE } = await CostPrice.findOne({
      network: "MTN-DATA_TRANSFER",
    });
    costPrice = DATA_TRANSFER_COST_PRICE;
  }
  if (plan_type == "AWOOF") {
    costPrice = planCostPrice || amountToCharge;
  }
  // res.sendStatus(200);
  // checking service availability
  const serviceAvailability = await servicesModel.findOne({
    serviceName:
      NETWORK === "MTN" && plan_type == "CG"
        ? "MTN-CG"
        : plan_type == "COUPON"
        ? "MTN-COUPON"
        : plan_type == "SME2"
        ? "MTN-SME2"
        : plan_type == "DATA_TRANSFER"
        ? "MTN-DATA_TRANSFER"
        : NETWORK,
    serviceType: "data",
  });
  // console.log(serviceAvailability);
  if (!serviceAvailability)
    return res.status(400).json({
      msg: `This service is not available at the moment`,
    });
  if (
    !serviceAvailability.isAvailable
    //  &&
    // plan_type == "DIRECT" &&
    // user.userName.toLowerCase() != "xtrahola"
  )
    return res.status(400).json({
      msg: `${NETWORK} ${plan_type} ${serviceAvailability.serviceType} is not available at the moment`,
    });
  // charging the user
  await User.updateOne({ _id: userId }, { $inc: { balance: -amountToCharge } });
  // generating receipt
  let transactionId = uuid();
  transactionId = `${new Date().getFullYear()}-DATA-${transactionId}`.substring(
    0,
    28
  );
  if (!loop)
    await generateReceipt({
      transactionId,
      planNetwork: NETWORK,
      status: "processing",
      planName: `${plan_type} ${dataVolume}`,
      phoneNumber: mobile_number,
      amountToCharge,
      balance,
      userId,
      userName: user.userName,
      type: "data",
      volumeRatio: volumeRatio,
      costPrice,
      planType: plan_type,
    });
  let API = "";
  if (NETWORK === "MTN")
    API = MTNDATA({
      ...req.body,
      plan_type,
      transactionId,
      userName: user.userName,
    });
  if (NETWORK === "AIRTEL")
    API = AIRTELDATA({ ...req.body, plan_type, transactionId });
  if (NETWORK === "9MOBILE") API = NMOBILEDATA({ ...req.body, transactionId });
  if (NETWORK === "GLO")
    API = GLODATA({ ...req.body, transactionId, userName: user.userName });
  const { status, msg, apiResponseId, apiResponse, supplier } = await API;
  checkContact({
    contactNumber: mobile_number,
    contactNetwork: NETWORK,
    userId: user._id,
  });
  if (status) {
    if (!loop)
      await Transactions.updateOne(
        { trans_Id: transactionId },
        {
          $set: {
            trans_Status: "success",
            apiResponseId: apiResponseId || "",
            apiResponse: apiResponse || msg,
            trans_supplier: supplier,
          },
        }
      );
    const successReceipt = await Transactions.findOne({
      trans_Id: transactionId,
    }).select("-trans_profit -trans_supplier");
    res.status(200).json({ msg, receipt: successReceipt });
    const pushTokenExit = await pushNotificationModel.findOne({
      userId,
      pushIsActive: true,
    });
    if (pushTokenExit) {
      // sendPushNotification({
      //   title: "Purchase Successful",
      //   body: `Your purchase of ${dataVolume} ${plan_type} data to ${mobile_number} was successful`,
      //   pushTokens: [pushTokenExit.pushToken],
      // });
    }
    if (user.referredBy) {
      referralBonus({
        sponsorUserName: user.referredBy,
        userName: user.userName,
        bonusAmount: volumeRatio,
        amountToCharge,
        sponsorTransId: transactionId,
        partnerPrice,
      });
    }
    autoSwitch({
      error: msg || "Transaction failed",
      product: `${NETWORK}-${plan_type}`,
      supplier: supplier,
    });
  } else {
    await User.updateOne(
      { _id: userId },
      { $inc: { balance: +amountToCharge } }
    );
    if (!loop)
      await Transactions.updateOne(
        { trans_Id: transactionId },
        {
          $set: {
            trans_Status: "failed",
            balance_After: balance,
            trans_profit: 0,
            trans_volume_ratio: 0,
            apiResponseId: apiResponseId || "",
            apiResponse: apiResponse || msg || "",
            trans_supplier: supplier,
          },
        }
      );
    const failedReceipt = await Transactions.findOne({
      trans_Id: transactionId,
    }).select("-trans_profit -trans_supplier");
    res.status(500).json({
      msg: msg || "Transaction failed",
      receipt: failedReceipt,
    });
    // AUTO SWITCH
    autoSwitch({
      error: msg || "Transaction failed",
      product: `${NETWORK}-${plan_type}`,
      supplier: supplier,
    });
    // SEND PUSH TOKEN
    const pushTokenExit = await pushNotificationModel.findOne({
      userId,
      pushIsActive: true,
    });
    if (pushTokenExit) {
      sendPushNotification({
        title: "Purchase Failed",
        body: `Your purchase of ${dataVolume} ${plan_type} data to ${mobile_number} was not successful`,
        pushTokens: [pushTokenExit.pushToken],
      });
    }
  }
  // send receipt to the user webhook url set by the user
  if (user.webhookUrl) {
    sendWebhookPayload({
      url: user.webhookUrl,
      transactionId,
    });
  }
};

const validateMeter = async (req, res) => {
  const { meterNumber, meterId, meterType } = req.body;
  if (!meterNumber && !meterId)
    return res.status(400).json({ msg: "All fields are required" });
  const meterIdObj = disco.find((e) => e.id == meterId);
  if (!meterIdObj) return res.status(400).json({ msg: "Invalid meter ID" });
  const { id, name } = meterIdObj;
  // console.log(req.body);
  try {
    const ValidateMeterResponse = await axios.get(
      `https://www.gladtidingsdata.com/ajax/validate_meter_number/?meternumber=${meterNumber}&disconame=${name}&mtype=${meterType.toUpperCase()}`,
      {
        headers: {
          Authorization: process.env.GLADITINGSDATA_TOKEN,
        },
      }
    );
    if (ValidateMeterResponse.data.invalid) {
      return res.status(400).json(ValidateMeterResponse.data);
    }
    return res.status(200).json(ValidateMeterResponse.data);
  } catch (error) {
    // console.log(error);
    res.status(500).json({
      msg: "Unable to validate meter",
    });
  }
};
const fetchDiscos = async (req, res) => {
  return res.status(200).json(disco);
};
const buyElectricity = async (req, res) => {
  const { meterId, meterNumber, amount, meterType } = req.body;
  const { userId, userType } = req.user;
  const amountToCharge = parseFloat(amount) + 50;
  if (!meterId || !meterNumber || !amount || !meterType)
    return res.status(400).json({ msg: "All fields are required" });
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
    res.status(200).json({ msg: msg, receipt, token });
  } else {
    // return the charged amount
    await User.updateOne(
      { _id: userId },
      { $inc: { balance: amountToCharge } }
    );
    res.status(500).json({ msg: msg || "Transaction failed" });
  }
};

const validateCableTv = async (req, res) => {
  const { smartCardNo, cableName } = req.body;
  if (!smartCardNo && !cableName)
    return res.status(400).json({ msg: "All fields are required" });

  try {
    const result = await validateCable(req.body);
    const { customerName, smartCardNo } = result;
    const response = {
      customerName,
      smartCardNo,
    };
    let isSuccess = result.status;
    return res
      .status(isSuccess ? 200 : 400)
      .json({ ...response, msg: result.msg || "Successfully validated" });
  } catch (error) {
    res.status(500).json({
      msg: "An error occur. Please try again later",
    });
  }
};

const buyCableTv = async (req, res) => {
  const { cableName, planId, customerName, smartCardNo } = req.body;
  if (!cableName || !planId || !customerName || !smartCardNo)
    return res.status(400).json({ msg: "All fields are required" });
  const planInfo = await cabletvModel.findOne({ planId });
  if (!planInfo)
    return res.status(400).json({ msg: "Invalid plan Id provided" });
  let transactionId = uuid();
  transactionId =
    `${new Date().getFullYear()}-CABLE-${transactionId}`.substring(0, 28);
  let user = await User.findOne({ _id: req.user.userId });
  let amountToCharge = planInfo.price;
  if (user.userType == "reseller") {
    amountToCharge = planInfo.resellerPrice;
  } else {
    amountToCharge = planInfo.apiPrice;
  }
  if (!amountToCharge)
    return res.status(400).json({ msg: "unable to charge user" });
  if (user.balance < amountToCharge || user.balance - amountToCharge < 0) {
    const response = "Insufficient balance. Kindly fund your wallet";
    return res.status(400).json({ msg: response });
  }
  try {
    // Charging the user
    await User.updateOne(
      { _id: req.user.userId },
      { $inc: { balance: -amountToCharge } }
    );

    generateReceipt({
      transactionId,
      planNetwork: cableName,
      status: "processing",
      planName: planInfo.planName,
      phoneNumber: smartCardNo,
      amountToCharge,
      balance: user.balance,
      userId: req.user.userId,
      userName: user.userName,
      type: "cable",
    });
    const result = await buyCable({ ...req.body, transactionId });
    const isSuccess = result.status;
    if (isSuccess) {
      res.status(200).json({ msg: result.msg });
      await Transactions.updateOne(
        { trans_Id: transactionId },
        { $set: { trans_Status: "success" } }
      );
    } else {
      res.status(400).json({ msg: result.msg });
      await Transactions.updateOne(
        { trans_Id: transactionId },
        { $set: { trans_Status: "failed" } }
      );
      await User.updateOne(
        { _id: req.user.userId },
        { $inc: { balance: amountToCharge } }
      );
    }
  } catch (error) {
    return res.status(500).json({ msg: "Something went wrong" });
  }
};
const fetchCable = async (req, res) => {
  const { cableName } = req.body;
  if (!cableName)
    return res.status(400).json({ msg: "Cable name must be provided" });
  const cable = await cabletvModel.find({ cableName: cableName });
  res.status(200).json(cable);
};
module.exports = {
  buyAirtime,
  buyData,
  buyElectricity,
  buyCableTv,
  validateCableTv,
  validateMeter,
  fetchCable,
  fetchDiscos,
};
