const { default: axios } = require("axios");
const usersModel = require("../Models/usersModel");
const generateReceipt = require("./generateReceipt");
const { v4: uuid } = require("uuid");

const getOTP = async (req, res) => {
  const { network: selectedNetwork, senderNumber } = req.body;
  const availableNetworks = {
    MTN: "1",
    AIRTEL: "2",
    GLO: "3",
    "9MOBILE": "4",
  };
  let network = availableNetworks[selectedNetwork];
  if (!network || !senderNumber)
    return res
      .status(400)
      .json({ msg: "Kindly provide the network and sender number" });
  try {
    const OTPresponse = await axios.post(
      `${process.env.AUTOPILOT_URL}/send-resend/auto-airtime-to-cash-otp`,
      { network, senderNumber },
      {
        headers: { Authorization: process.env.AUTOPILOT_API_KEY },
      }
    );
    console.log(OTPresponse);

    res.status(200).json({
      msg: OTPresponse.data.data.message,
      identifier: OTPresponse.data.data.identifier,
    });
  } catch (error) {
    console.log(error);
    const errorMsg = error.response.data.data.message || "something went wrong";
    return res.status(400).json({ msg: errorMsg });
  }
};
const verifyOTP = async (req, res) => {
  const { identifier, otp } = req.body;
  if (!identifier || !otp)
    return res.status(400).json({ msg: "Kindly provide OTP" });
  try {
    const verifyOTPResponse = await axios.post(
      `${process.env.AUTOPILOT_URL}/verify/auto-airtime-to-cash-otp`,
      { otp, identifier },
      {
        headers: { Authorization: process.env.AUTOPILOT_API_KEY },
      }
    );
    const { message, airtimeBalance, sessionId, tariffPlan, tariffType } =
      verifyOTPResponse.data.data;
    res.status(200).json({
      msg: message,
      airtimeBalance,
      sessionId,
      tariffPlan,
      tariffType,
    });
  } catch (error) {
    console.log(error);
    const errorMsg = error.response.data.data.message || "something went wrong";
    return res.status(400).json({ msg: errorMsg });
  }
};
const transferAirtime = async (req, res) => {
  const { network: selectedNetwork, amount, transferPin, sessionId } = req.body;
  const { userId } = req.user;
  const availableNetworks = {
    MTN: "1",
    AIRTEL: "2",
    GLO: "3",
    "9MOBILE": "4",
  };
  let network = availableNetworks[selectedNetwork];
  if (!amount || !transferPin) {
    return res
      .status(400)
      .json({ msg: "Enter a valid amount and share and sell Pin" });
  }
  const { nin, bvn, balance, userName } = await usersModel.findOne({
    _id: userId,
  });
  //   console.log("STEP 1 END");
  // VALIDATION
  // if (!nin && !bvn) {
  //   return res
  //     .status(400)
  //     .json({ msg: "Kindly do your KYC before selling your airtime" });
  // }

  if (amount < 1000) {
    return res.status(400).json({ msg: "Minimum airtime should be 1000" });
  }

  let reference = `${new Date().getFullYear()}-${uuid()}`.substring(0, 28);
  //   console.log("STEP 2 END");
  const payload = { network, reference, amount, sessionId, quantity: "1" };
  payload.pin = transferPin;
  let actualAmount = req.body.amount;
  if (actualAmount >= 5000) {
    payload.quantity = parseInt(actualAmount / 5000).toString();
    payload.amount = "5000";
  } else payload.quantity = "1";
  //   console.log(payload);
  try {
    // if (amount * quantity > 50000) {
    //   return res.status(400).json({ msg: "You can't send more than 50,000 in a da " });
    // }
    // TRANSFER AIRTIME
    const transferAirtimeResponse = await axios.post(
      `${process.env.AUTOPILOT_URL}/send-airtime/auto-airtime-to-cash`,
      payload,
      {
        headers: { Authorization: process.env.AUTOPILOT_API_KEY },
      }
    );
    const { message, info, details, network } =
      transferAirtimeResponse.data.data;
    // console.log({ message, info, details });
    // console.log("STEP 3 END");
    res.status(200).json({
      msg: message,
    });
    // PAYMENT METHOD HERE
    let totalSuccess = details.filter((e) => e.status == "success");
    let totalAmountTransfer = totalSuccess.reduce((acc, curr) => {
      acc =
        acc +
        (parseFloat(curr.senderBalanceBefore) -
          parseFloat(curr.senderBalanceAfter));
      return acc;
    }, 0);
    let amountToCreditUser = totalAmountTransfer * 0.8;
    if (totalAmountTransfer >= 5000)
      amountToCreditUser = totalAmountTransfer * 0.85;
    if (totalAmountTransfer >= 10000)
      amountToCreditUser = totalAmountTransfer * 0.9;

    //generate receipt
    await generateReceipt({
      transactionId: reference,
      planNetwork: "MTN",
      status: "success",
      planName: `Airtime transfer ${amount}`,
      phoneNumber: details[0].senderNumber,
      amountToCharge: amountToCreditUser,
      balance,
      userId,
      userName: userName,
      type: "wallet",
      response: message,
      increased: true,
    });
    //increase the user Balance
    await usersModel.updateOne(
      { _id: userId },
      { $inc: { balance: amountToCreditUser } }
    );
  } catch (error) {
    // console.log(error);
    const errorMsg = error.response.data.data.message || "something went wrong";
    return res.status(400).json({ msg: errorMsg });
  }
};
module.exports = { getOTP, verifyOTP, transferAirtime };
