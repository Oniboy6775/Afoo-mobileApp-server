const User = require("../Models/usersModel");
const Coupon = require("../Models/couponModel");
const Transaction = require("../Models/transactionModel");
const Inbox = require("../Models/simInboxModel");
const Services = require("../Models/services");
const voucher_codes = require("voucher-code-generator");
const sendEmail = require("../Utils/sendMail");
const { REFUND_RECEIPT } = require("./TransactionReceipt");
const dataModel = require("../Models/dataModel");
const Supplier = require("../Models/supplierModel");
const CostPrice = require("../Models/costPriceModel");
const servicesModel = require("../Models/servicesModel");
const notification = require("../Models/notification");
const axios = require("axios");
const generateReceipt = require("./generateReceipt");
const { reverseReferralBonus } = require("../Utils/referralBonus");
const bcrypt = require("bcrypt");
const pushNotificationModel = require("../Models/pushNotificationModel");
const { sendPushNotification } = require("../Utils/expo/notification");

const adminDetails = async (req, res) => {
  try {
    const allUsers = await User.find().sort("-createdAt").limit(10).skip(0);
    const availableServices = await Services.find();
    res.status(200).json({
      allUsers: allUsers,
      services: availableServices,
    });
  } catch (error) {
    console.log(error);
    console.log(error.message);
    res.status(500).json({ error: error });
  }
};
const generateCoupon = async (req, res) => {
  const { userAccount, amount } = req.body;
  const couponCode = voucher_codes.generate({
    length: 10,
  });
  if (!userAccount || !amount)
    return res.status(400).json({ msg: "All feilds are required" });
  let user = await User.find({ userName: userAccount });
  if (!user) user = await User.find({ email: userAccount });
  if (user.length < 1)
    return res
      .status(400)
      .json({ msg: `No user with this Username: ${userAccount}` });

  const newCoupon = new Coupon({
    couponCode: `${couponCode[0]}`,
    couponOwner: userAccount,
    amount: amount,
    isUsed: false,
  });
  const savedCoupon = await newCoupon.save();
  return res.status(200).json(savedCoupon);
};

const sendMail = async (req, res) => {
  const { subject, message, url, linkMessage, from, to, userAccount } =
    req.body;
  if (!subject || !message || !url || !linkMessage)
    return res.status(400).json({ msg: "All fields are required" });
  let userEmail = "";
  let userUserName = "";
  // Sending message to a user
  if (userAccount) {
    const { email, userName } = await User.findOne({ userName: userAccount });
    userEmail = email;
    userUserName = userName;
    sendEmail(
      userEmail,
      subject,
      {
        message: message,
        link: url,
        linkMessage: linkMessage,
        businessName: userAccount
          ? userUserName
          : `${process.env.BUSINESS_NAME} user`,
      },
      "../templates/generalMessage.handlebars"
    );
  } else {
    // sending message to all user
    const allUsers = await User.find().select("email userName");
    let i = 0;
    // let currentUser= allUsers[i];
    const sendAllEmail = () => {
      setTimeout(() => {
        sendEmail(
          allUsers[i].email,
          subject,
          {
            message: message,
            link: url,
            linkMessage: linkMessage,
            businessName: allUsers[i].userName,
          },
          "../templates/generalMessage.handlebars"
        );
        i++;
        if (i < allUsers.length) sendAllEmail();
      }, [10000]);
    };
    sendAllEmail();
    // for (let i = 0; i < allUsers.length; i++) {
    //   sendEmail(
    //     allUsers[i].email,
    //     subject,
    //     {
    //       message: message,
    //       link: url,
    //       linkMessage: linkMessage,
    //       businessName: allUsers[i].userName,
    //     },
    //     "../templates/generalMessage.handlebars"
    //   );
    // }
  }
  return res.status(200).json({
    msg: "All email has been sent successfully",
  });
};
const refund = async (req, res) => {
  const { id: transactionIds } = req.params;
  const allTransactionsId = transactionIds.split(",");
  try {
    for (const transactionId of allTransactionsId) {
      console.log(transactionId);
      const transactionObject = await Transaction.findOne({
        _id: transactionId,
      });
      if (!transactionObject) continue;
      // return res.status(404).json({ msg: "Transaction not found" });
      // destructuring the transaction

      const {
        trans_By: userId,
        trans_Type,
        trans_amount,
        _id,
        trans_Status,
        trans_volume_ratio,
        trans_profit,
        earningId,
      } = transactionObject;

      if (trans_Status === "refunded" || trans_Type == "refund") {
        console.log("User has been refunded before");
        continue;
      }
      if (trans_Status !== "processing" && trans_Status !== "success") {
        console.log("UNABLE TO REFUND THIS TRANSACTION");
        continue;
      }

      // return res.status(400).json({ msg: "User has been refunded before" });
      // Looking for owner of the transaction
      const transactionOwner = await User.findOne({
        _id: userId,
      });
      if (!transactionOwner) {
        console.log("Transaction owner not found");
        continue;
      }
      // return res.status(400).json({ msg: "Transaction owner not found" });
      const { userName, referredBy, balance } = transactionOwner;

      // generate receipt
      const response = await REFUND_RECEIPT({
        ...transactionObject._doc,
        balance,
        isOwner: true,
      });
      // return the amount to the user
      if (response) {
        await User.updateOne(
          { _id: userId },
          { $inc: { balance: trans_amount } }
        );
        reverseReferralBonus({
          bonusAmount: trans_volume_ratio,
          sponsorUserName: referredBy,
          userName,
          amountToCharge: trans_profit,
          earningId,
        });
      }
      const pushTokenExit = await pushNotificationModel.findOne({
        userId,
        pushIsActive: true,
      });
      if (pushTokenExit) {
        sendPushNotification({
          title: "Refund successful",
          body: `A refund of ₦${trans_amount} has been credited to your account`,
          pushTokens: [pushTokenExit.pushToken],
        });
      }
      await Transaction.updateOne(
        { _id: transactionId },
        {
          $set: {
            trans_Status: "refunded",
            trans_profit: 0,
            trans_volume_ratio: 0,
          },
        }
      );
    }

    // res.status(200).json({
    //   msg: `Refund of ₦ ${trans_amount} for ${userName} was successful`,
    // });
    res.status(200).json({
      msg: `All refunds were processed successfully`,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message, error: error });
  }
};
const updateAvailableServices = async (req, res) => {
  const { serviceId, serviceStatus } = req.body;
  await Services.updateOne({ _id: serviceId }, { $set: { serviceStatus } });
  res.status(200).json({ msg: "Service updated" });
};

const searchUsers = async (req, res) => {
  const { userType, phoneNumber, sort, userName } = req.query;
  let queryObject = {};

  if (userType && userType !== "all") {
    queryObject.userType = { $regex: userType, $options: "i" };
  }
  if (phoneNumber) {
    queryObject.phoneNumber = { $regex: phoneNumber, $options: "i" };
  }
  let userId;
  if (userName) {
    queryObject.userName = { $regex: userName, $options: "i" };
  }
  if (userName && userId) {
    queryObject._id = userId;
  }

  let result = User.find(queryObject);
  if (sort) {
    const sortList = sort.split(",").join(" ");
    result = result.sort(sortList);
  } else {
    result = result.sort("-createdAt");
  }
  const { balance: adminBalance } = await User.findOne({
    _id: process.env.ADMIN_ID,
  });

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 100;
  const skip = (page - 1) * limit;
  result = await result.skip(skip).limit(limit);

  let noOfUsers = await User.countDocuments(queryObject);
  const totalPages = Math.ceil(noOfUsers / limit);
  // Total user balance
  let allUser = await User.find().select("balance");
  let allBalance = allUser.reduce((acc, curr) => {
    acc += curr.balance;
    return acc;
  }, 0);
  res.status(200).json({
    users: result,
    totalPages,
    totalUsers: noOfUsers,
    totalBalance: allBalance - adminBalance,
  });
};
const updatePrice = async (req, res) => {
  const {
    newPrice: { price, reseller, api, partner },
    dataId,
  } = req.body;
  const { volumeRatio, plan_network, plan_type } = await dataModel.findOne({
    _id: dataId,
  });
  if (volumeRatio == 1) {
    let dataList = await dataModel.find({
      plan_network,
      plan_type,
      volumeRatio: { $gte: 0.9 },
    });
    for (let i = 0; i < dataList.length; i++) {
      const currentItem = dataList[i];
      console.log(currentItem);
      const isUpdated = await dataModel.updateOne(
        { id: currentItem.id },
        {
          $set: {
            my_price: price
              ? currentItem.volumeRatio * price
              : currentItem.my_price,
            resellerPrice: reseller
              ? currentItem.volumeRatio * reseller
              : currentItem.resellerPrice,
            apiPrice: api
              ? currentItem.volumeRatio * api
              : currentItem.apiPrice,
            partnerPrice: partner
              ? currentItem.volumeRatio * partner
              : currentItem.partnerPrice,
          },
        }
      );
      console.log({ isUpdated });
    }
    return res.status(200).json({ msg: "All Prices updated successfully" });
  } else {
    let newUpdate = {};
    if (price) {
      newUpdate.my_price = price;
    }
    if (reseller) {
      newUpdate.resellerPrice = reseller;
    }
    if (partner) {
      newUpdate.partnerPrice = partner;
    }
    if (api) {
      newUpdate.apiPrice = api;
    }
    try {
      const isUpdated = await dataModel.updateOne(
        { _id: dataId },
        { $set: newUpdate }
      );
      console.log(isUpdated);
      res.status(200).json({ msg: "Price updated successfully" });
    } catch (e) {
      res.status(500).json({ msg: "An error occur" });
    }
  }
};
const upgradeUser = async (req, res) => {
  const { userType, userId } = req.params;
  try {
    await User.updateOne({ _id: userId }, { $set: { userType } });
    console.log({ userType, userId });

    res.status(200).json({ msg: `User upgraded to a ${userType}` });
  } catch (error) {
    res.status(500).json({ msg: "User upgrade failed" });
  }
};

const fetchSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.find();
    res.status(200).json(supplier);
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};
const updateSupplier = async (req, res) => {
  const { network, supplierName } = req.body;
  try {
    const status = await Supplier.updateOne(
      { network },
      { $set: { supplierName: supplierName } }
    );
    console.log(status);
    res
      .status(200)
      .json({ msg: `${network} supplier updated to ${supplierName}` });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};
const updateCostPrice = async (req, res) => {
  const { network, costPrice } = req.body;
  try {
    await CostPrice.updateOne({ network }, { $set: { costPrice } });
    res
      .status(200)
      .json({ msg: `${network} cost price updated to ${costPrice}` });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};
const updateServicesAvailability = async (req, res) => {
  const { serviceName, serviceType, serviceStatus } = req.body;
  try {
    await servicesModel.updateOne(
      { serviceName, serviceType },
      { $set: { isAvailable: serviceStatus === "enable" ? true : false } }
    );
    res.status(200).json({
      msg: `${serviceName} ${serviceType} service has been ${serviceStatus}d`,
    });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};
const checkServicesAvailability = async (req, res) => {
  try {
    const availableServices = await servicesModel.find();
    res.status(200).json(availableServices);
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};
const updateNotification = async (req, res) => {
  const { msg } = req.body;
  try {
    await notification.updateMany({ msg });
    return res.status(200).json({ msg });
  } catch (e) {
    return res.status(500).json({ msg: "something went wrong" });
  }
};
const getNotification = async (req, res) => {
  try {
    const { msg } = await notification.findOne();
    // console.log(msg);
    return res.status(200).json({ msg });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ msg: "something went wrong" });
  }
};
const reQueryWithdrawal = async (req, res) => {
  const { transactionId } = req.body;
  let isAvailable = await Transaction.findOne({
    apiResponseId: transactionId,
    trans_Status: "pending",
  });
  if (!isAvailable)
    return res
      .status(400)
      .json({ msg: "Transaction does not exist or has been refunded before" });
  const { trans_By, trans_amount, trans_UserName, trans_Id } = isAvailable;
  //if user was chared when initiating the withdrawal but couldn't reach the provider
  if (trans_Id === transactionId) {
    const { balance, userName } = await User.findOne({ _id: trans_By });
    await generateReceipt({
      planNetwork: "refund",
      status: "success",
      planName: `for failed withdrawal of ₦${trans_amount}`,
      phoneNumber: trans_UserName,
      amountToCharge: trans_amount,
      balance,
      userId: trans_By,
      userName,
      type: "refund",
      increased: true,
    });
    await Transaction.updateOne(
      { apiResponseId: transactionId },
      { $set: { trans_Status: "refunded" } }
    );
    await User.updateOne(
      { _id: trans_By },
      { $inc: { balance: +trans_amount } }
    );
    return res.status(200).json({
      msg: "The transaction was not successful, your wallet has been refunded",
    });
  }
  //  console.log({ trans_Id, transactionId });
  const { VPAY_API_URL, VPAY_USERNAME, VPAY_PASSWORD, VPAY_PUBLIC_KEY } =
    process.env;
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

    const { data } = await authFetch.get(
      `/api/service/v1/query/merchant/wallet/requery/transaction/${transactionId}`,
      { headers: { publicKey: VPAY_PUBLIC_KEY, "b-access-token": token } }
    );
    // console.log(data);
    //     {
    // [0]   status: true,
    // [0]   data: { status: '00', message: 'Successful Transaction Retrieval' }
    // [0] }
    // successful
    if (data.data.status === "00") {
      await Transaction.updateOne(
        { apiResponseId: transactionId },
        { $set: { trans_Status: "success" } }
      );
      return res.status(200).json({ msg: "The transaction was successful" });
    }
    // pending
    else if (data.data.status === "09") {
      return res
        .status(200)
        .json({ msg: "The transaction is currently pending" });
    } else {
      const { balance, userName } = await User.findOne({ _id: trans_By });
      await generateReceipt({
        planNetwork: "refund",
        status: "success",
        planName: `for failed withdrawal of ₦${trans_amount}`,
        phoneNumber: trans_UserName,
        amountToCharge: trans_amount,
        balance,
        userId: trans_By,
        userName,
        type: "refund",
        increased: true,
      });
      await Transaction.updateOne(
        { apiResponseId: transactionId },
        { $set: { trans_Status: "refunded" } }
      );
      await User.updateOne(
        { _id: trans_By },
        { $inc: { balance: +trans_amount } }
      );
      return res.status(200).json({
        msg: "The transaction was not successful, your wallet has been refunded",
      });
    }
  } catch (error) {
    res.status(500).json({ msg: "An error occur" });
    console.log(error);
  }
};
const getCostPrice = async (req, res) => {
  try {
    const costPrice = await CostPrice.find();
    return res.status(200).json(costPrice);
  } catch (error) {
    res.status(500).json({ msg: "An error occur" });

    console.log(error);
  }
};
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    return res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ msg: "An error occur" });

    console.log(error);
  }
};
const setSpecialPricing = async (req, res) => {
  const { userId, productName, price } = req.body;
  console.log(req.body);
  if (!productName || !price)
    return res.status(400).json({ msg: "All fields are required" });
  try {
    const specialUser = await User.findOne({ _id: userId });
    let newPrices = [...specialUser.specialPrices];
    const oldIndex = specialUser.specialPrices.findIndex(
      (e) => e.productName === productName
    );
    if (oldIndex < 0) {
      newPrices = [...newPrices, { productName, price }];
    } else {
      newPrices[oldIndex] = { productName, price };
    }

    const isUpdated = await User.updateOne(
      { _id: userId },
      { $set: { specialPrices: newPrices, isSpecial: true } }
    );
    console.log(newPrices);
    console.log({ isUpdated });
    res.status(200).json({
      msg: `${productName} updated to ₦${price} for ${specialUser.userName}`,
    });
  } catch (e) {
    res.status(500).json({ msg: "An error occur" });
    console.log(e);
  }
};
const approveWithdrawal = async (req, res) => {
  const { withdrawalId } = req.body;
  let isAdmin = process.env.ADMIN_ID === req.user.userId;
  if (!isAdmin)
    return res
      .status(400)
      .json({ msg: "You are not allowed to perform this action" });

  try {
    const { VPAY_API_URL, VPAY_USERNAME, VPAY_PASSWORD, VPAY_PUBLIC_KEY } =
      process.env;
    const withdrawalTransaction = await Transaction.findById(withdrawalId);
    if (!withdrawalTransaction)
      return res.status(400).json({ msg: "No transaction with this ID" });
    //check if the requester is the one who made the transaction
    const { trans_By, trans_amount, trans_Status } = withdrawalTransaction;
    if (trans_Status === "success")
      return res.status(400).json({ msg: "This withdrawal has been settled" });
    const user = await User.findById(trans_By);
    if (!user) return res.status(400).json({ msg: "user does not exist" });
    const { accountNumber, bankCode, nameOnAccount, bank } =
      user.withdrawalDetails;
    // make transfer to the users bank here
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
        amount: trans_amount,
        remark: "partnership",
        transaction_ref: `abdul553-DataReloaded-partnership${withdrawalId}`,
      },
      { headers: { publicKey: VPAY_PUBLIC_KEY, "b-access-token": token } }
    );
    console.log(data);
    await Transaction.updateOne(
      { _id: withdrawalId },
      {
        $set: {
          trans_Status: "success",
          apiResponseId: data.data.data.txnId,
          apiResponse: `A payment of ${trans_amount} has been sent to ${nameOnAccount} ${accountNumber} ${bank}.ID: ${data.data.data.sessionId}`,
        },
      }
    );
    res.status(200).json({ msg: "withdrawal approved " });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "something went wrong" });
  }
};
const resetUserPassword = async (req, res) => {
  const { userId } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const newPassword = "12345678";
    const hashedPwd = await bcrypt.hash(newPassword, salt);
    const { userName } = await User.findOne({ _id: userId });
    await User.updateOne({ _id: userId }, { $set: { password: hashedPwd } });
    res
      .status(200)
      .json({ msg: `${userName}'s password has been reset successfully` });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ msg: "something went wrong" });
  }
};
module.exports = {
  adminDetails,
  generateCoupon,
  sendMail,
  refund,
  updateAvailableServices,
  searchUsers,
  updatePrice,
  upgradeUser,
  updateSupplier,
  fetchSupplier,
  updateCostPrice,
  updateServicesAvailability,
  checkServicesAvailability,
  updateNotification,
  getNotification,
  reQueryWithdrawal,
  getCostPrice,
  getSuppliers,
  setSpecialPricing,
  approveWithdrawal,
  resetUserPassword,
};
