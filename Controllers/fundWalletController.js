const Coupon = require("../Models/couponModel");
const User = require("../Models/usersModel");
const Transaction = require("../Models/transactionModel");
const axios = require("axios");
const { v4: uuid } = require("uuid");
const { COUPON_RECEIPT } = require("./TransactionReceipt");
const Flutterwave = require("flutterwave-node-v3");
const sha512 = require("js-sha512").sha512;
const crypto = require("crypto");
const generateReceipt = require("./generateReceipt");
const jwt = require("jsonwebtoken");
const { sendPushNotification } = require("../Utils/expo/notification");
const pushNotificationModel = require("../Models/pushNotificationModel");

const coupon = async (req, res) => {
  const { userId } = req.user;
  const user = await User.findById(userId);
  const { userName, coupon } = req.body;
  if (!coupon) return res.status(400).json({ msg: "Please enter Coupon" });
  if (!userName)
    return res.status(400).json({ msg: "Please Provide username" });
  try {
    const AvailableCoupon = await Coupon.findOne({
      couponCode: coupon,
    });
    if (!AvailableCoupon)
      return res.status(400).json({ msg: "Used or Invalid Coupon Code" });

    if (AvailableCoupon.couponOwner !== user.userName)
      return res
        .status(400)
        .json({ msg: "This Coupon belongs to another user" });
    if (AvailableCoupon.isUsed)
      return res.status(400).json({ msg: "Coupon code used" });
    if (userName !== user.userName)
      return res.status(400).json({ msg: "Unable to fund this account" });
    const { amount, couponCode, isUsed, couponOwner } = AvailableCoupon;

    if (isUsed) return res.status(400).json({ msg: "Coupon Code Used" });
    const response = await COUPON_RECEIPT({ user, amount, userId });
    // Adding coupon amount to user balance
    await User.updateOne(
      { _id: req.user.userId },
      { $inc: { balance: amount } }
    );
    await Coupon.findOneAndDelete({
      couponCode: couponCode,
      couponOwner: userName,
    });

    res.status(200).json({
      msg: `You have successfully fund your wallet with ${amount}`,
      amount: amount,
      receipt: response,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const initiateFlutterwave = async (req, res) => {
  // res.status(200).json({ msg: "initiate flutterwave fund" });
  return res.status(400).json({
    msg: "Kindly use the account number on your dashboard to fund your wallet",
  });
  const { amount } = req.body;
  const userId = req.user.userId;
  if (!amount || amount < 100)
    return res.status(400).json({ msg: "Enter an amount greater than 100" });
  const amountToBeCharged = amount;

  const amountToCreditUser =
    parseFloat(amountToBeCharged) - amountToBeCharged * 0.015;
  const user = await User.findOne({ _id: userId });
  const transactionId = uuid();
  try {
    const initiate = await axios.post(
      `${process.env.FLUTTERWAVE_API}/payments`,
      {
        tx_ref: transactionId,
        amount: amountToBeCharged,
        redirect_url: `https://${process.env.FRONTEND_URL}/profile/dashboard`,
        payment_options: "card",
        currency: "NGN",
        customer: {
          email: user.email,
          phone_number: user.phoneNumber,
          name: user.fullName,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET}`,
        },
      }
    );
    const { data } = initiate.data;

    const transactionDetails = {
      trans_Id: transactionId,
      trans_By: userId,
      trans_Type: "wallet",
      trans_Network: `Auto-funding`,
      phone_number: `FLW-${user.userName}`,
      trans_amount: amountToCreditUser,
      balance_Before: user.balance,
      balance_After: user.balance,
      trans_Date: `${new Date().toDateString()} ${new Date().toLocaleTimeString()}`,
      trans_Status: "pending",
      createdAt: Date.now(),
    };
    const newTransaction = Transaction(transactionDetails).save();
    res.status(200).json({
      msg: "Payment Initiated",
      link: data.link,
      receipt: newTransaction,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "internal server error" });
  }
};

// CREDITING A USER (Flutterwave)
const flutterwave = async (req, res) => {
  res.sendStatus(200);
  var hash = req.headers["verif-hash"];
  // console.log(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
  const flw = new Flutterwave(
    process.env.FLUTTERWAVE_PUBLIC,
    process.env.FLUTTERWAVE_SECRET
  );
  const verify = await flw.Transaction.verify({ id: req.body.id });
  const { status, tx_ref, amount, meta, customer } = verify.data;
  const userInitiatedTransaction = await Transaction.findOne({
    trans_Id: tx_ref,
  });
  const amountToCreditUser = parseFloat(amount) - amount * 0.015;
  console.log(amountToCreditUser);

  // const user = await User.findOne({ email: customer.email });
  if (
    status === "successful" &&
    userInitiatedTransaction.trans_Status === "pending"
  ) {
    // UPDATE THE  TRANSACTION STATUS
    await Transaction.updateOne(
      { trans_Id: tx_ref },
      {
        trans_Status: status,
        trans_Network: `Auto-funding-SUCCESS`,
      }
    );
    // INCREMENT TRANSACTION
    await Transaction.updateOne(
      { trans_Id: tx_ref },
      {
        $inc: {
          balance_After: amountToCreditUser,
        },
      }
    );
    // INCREMENT USER BALANCE
    await User.updateOne(
      { email: customer.email },
      { $inc: { balance: amountToCreditUser } }
    );
  } else {
    await Transaction.updateOne(
      { trans_Id: tx_ref },

      {
        trans_Status: status,
      }
    );
  }
};

// Crediting a user (monnify)
const monnify = async (req, res) => {
  res.sendStatus(200);
  const stringifiedBody = JSON.stringify(req.body);
  if (!process.env.MONNIFY_API_SECRET) {
    console.log("no API secret");
    return;
  }
  const computedHash = sha512.hmac(
    process.env.MONNIFY_API_SECRET,
    stringifiedBody
  );
  const monnifySignature = req.headers["monnify-signature"];
  // console.log({ monnifySignature, computedHash });
  if (!monnifySignature) return;
  if (monnifySignature != computedHash) return;

  const {
    eventType,
    eventData: {
      paidOn,
      settlementAmount,
      amountPaid,
      customer: { email },
      destinationAccountInformation,
    },
  } = req.body;
  if (eventType !== "SUCCESSFUL_TRANSACTION") return;
  if (!req.body.eventData.customer.email) return;
  if (email == "ajala802@gmail.com") return;
  let user = await User.findOne({ email });

  if (!user) return;
  const { _id, balance, userName } = user;
  // INCREMENT USER BALANCE
  // console.log(req.body);
  let amountToCredit = settlementAmount;
  let bankName = destinationAccountInformation.bankName;
  let accountNumber = destinationAccountInformation.accountNumber;
  let charges = (amountPaid - settlementAmount).toFixed(2);
  // let amountToCredit = amountPaid;
  if (user.userType == "api user") amountToCredit = settlementAmount;
  await User.updateOne({ _id }, { $inc: { balance: amountToCredit } });
  await generateReceipt({
    transactionId: uuid(),
    planNetwork: "Auto-funding||",
    status: "success",
    planName: `${bankName || "monnify"} ₦${amountPaid}`,
    phoneNumber: accountNumber || userName,
    response: `A payment of ₦${amountPaid} received from ${bankName || ""} ${
      accountNumber || ""
    }. ₦${settlementAmount} has been credited and ₦${charges} bank charges has been deducted`,
    amountToCharge: Number(amountToCredit),
    balance: balance,
    userId: _id,
    userName: userName,
    type: "wallet",
    increased: true,
    // wavedAmount: settlementAmount - amountToCredit,
  });
  // send push notification
  const notificationExist = await pushNotificationModel.findOne({
    userId: _id,
    pushIsActive: true,
  });
  if (notificationExist)
    sendPushNotification({
      title: "Payment successful",
      body: `Your wallet has been funded with ${settlementAmount}`,
      pushTokens: [notificationExist.pushToken],
    });
};

// Initial Squad
const initiateSquad = async (req, res) => {
  const { amount, email } = req.body;
  const { userId } = req.user;
  const user = await User.findOne({ _id: userId });
  if (!email || !amount)
    return res.status(400).json({ msg: "Please provide all values" });
  try {
    const initiate = await axios.post(
      `${process.env.SQUAD_API_URL}/transaction/initiate`,
      {
        amount: amount * 100,
        email,
        currency: "NGN",
        initiate_type: "inline",
        callback_url: `https://${process.env.FRONTEND_URL}/profile/dashboard`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SQUAD_SECRET_KEY}`,
        },
      }
    );
    const { data } = initiate.data;
    const transactionDetails = {
      transactionId: data.transaction_ref,
      planNetwork: `Auto-funding||SQUAD`,
      status: "pending",
      planName: `₦${parseFloat(data.transaction_amount / 100)}`,
      type: "wallet",
      phoneNumber: user.userName,
      amountToCharge: parseFloat(data.transaction_amount / 100),
      balance: user.balance,
      userId: userId,
      userName: user.userName,
      increased: "none",
    };

    await generateReceipt(transactionDetails);
    res.status(200).json({
      msg: "Payment Initiated",
      link: data.checkout_url,
    });
  } catch (e) {
    console.log(e);
    console.log(e.response);
    return res.status(500).json({ msg: "Something went wrong" });
  }
};
// creditingWallet
// const squadSuccessful = async (req, res) => {
//   res.sendStatus(200);
//   console.log(req.body);
//   const hash = crypto
//     .createHmac("sha512", process.env.SQUAD_SECRET_KEY)
//     .update(JSON.stringify(req.body))
//     .digest("hex")
//     .toUpperCase();
//   if (hash != req.headers["x-squad-encrypted-body"]) return;
//   if (req.body.Event !== "charge_successful") return;
//   const {
//     transaction_ref,
//     transaction_status,
//     email,
//     // transaction_type,
//     // amount,
//     merchant_amount,
//   } = req.body.Body;
//   try {
//     const user = await User.findOne({ email });
//     const transaction = await Transaction.findOne({
//       trans_Id: transaction_ref,
//     });
//     if (!transaction) return;

//     // updating transaction

//     await Transaction.updateOne(
//       {
//         trans_Id: transaction_ref,
//         phone_number: user.userName,
//       },
//       {
//         $set: {
//           trans_amount: parseFloat(merchant_amount / 100),
//           balance_Before: user.balance,
//           balance_After: user.balance + parseFloat(merchant_amount / 100),
//           trans_Date: Date.now(),
//           trans_Status: transaction_status,
//           paymentLink: "",
//           trans_Status: "success",
//         },
//       }
//     );

//     // increase the balance

//     await User.updateOne(
//       { _id: user._id },
//       { $inc: { balance: merchant_amount / 100 } }
//     );
//     res.sendStatus(200);
//   } catch (e) {
//     res.sendStatus(500);
//     console.log("something went wrong");
//   }
// };
const vPay = async (req, res) => {
  res.sendStatus(200);
  console.log(req.body);
  let secret = req.headers["x-payload-auth"];
  let payload = jwt.decode(secret);
  secret = payload.secret;
  if (secret !== process.env.VPAY_SECRET_KEY) {
    console.log("secret key not match");
    console.log(secret, process.env.VPAY_SECRET_KEY);
    return;
  }
  console.log("secret matched!!!");
  const {
    amount: amountPaid,
    account_number,
    originator_account_name,
    originator_bank,
    originator_account_number,
    fee,
  } = req.body;
  // checking user to credit
  if (account_number == "4602773752") return;
  const userToCredit = await User.findOne({
    reservedAccountNo3: account_number,
  });
  if (!userToCredit) {
    console.log("User with the account does not exist");
    return;
  }
  // increasing user balance
  // let totalCharges = fee;
  let amountToCredit = amountPaid - fee;
  // if (userToCredit.userType === "api user")
  //   amountToCredit = amountPaid - totalCharges;
  await User.updateOne(
    { _id: userToCredit._id },
    {
      $inc: { balance: amountToCredit },
    }
  );
  // generating receipt
  await generateReceipt({
    transactionId: uuid(),
    planNetwork: "Auto-funding||VFD",
    status: "success",
    planName: `₦${amountPaid}`,
    phoneNumber: account_number,
    amountToCharge: amountToCredit,
    balance: userToCredit.balance,
    userId: userToCredit._id,
    userName: userToCredit.userName,
    type: "wallet",
    // response: `${originator_account_name} ${originator_account_number} ${}`,
    response: `A payment of ₦${amountPaid} received from ${
      originator_bank || ""
    } ${
      originator_account_number || ""
    }. ₦${amountToCredit} has been credited and ₦${fee} bank charges has been deducted`,
    increased: true,
    // wavedAmount: userToCredit.userType === "api user" ? 0 : -totalCharges,
  });
  // send push notification
  const notificationExist = await pushNotificationModel.findOne({
    userId: userToCredit._id,
    pushIsActive: true,
  });
  if (notificationExist) {
    sendPushNotification({
      title: "Payment successful",
      body: `Your wallet has been funded with ${amountToCredit}`,
      pushTokens: [notificationExist.pushToken],
    });
  }
};
module.exports = {
  coupon,
  initiateFlutterwave,
  flutterwave,
  monnify,
  initiateSquad,
  // squadSuccessful,
  vPay,
};
