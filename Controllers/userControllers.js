// IMPORTS
const jwt = require("jsonwebtoken");
const randomToken = require("rand-token");
const { v4: uuid } = require("uuid");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// MODELS
const User = require("../Models/usersModel");
const Data = require("../Models/dataModel");
const Transaction = require("../Models/transactionModel");
const Token = require("../Models/tokenModel");
const Contact = require("../Models/contactModel");
const cabletvModel = require("../Models/cabletvModel");
// UTILS
const newReferral = require("../Utils/newReferral");
const sendEmail = require("../Utils/sendMail");
const generateAccountNumber = require("../Utils/generateAccountNumber");

// OTHERS
const { cableName } = require("../API_DATA/cableName");
const { disco } = require("../API_DATA/disco");
const { network } = require("../API_DATA/network");
const { TRANSFER_RECEIPT, BONUS_RECEIPT } = require("./TransactionReceipt");
const { MTN_CG, MTN_SME } = require("../API_DATA/newData");
// const generateVpayAcc = require("../Utils/generateVpayAccount");
const generateAcc = require("../Utils/accountNumbers");
const { default: axios } = require("axios");
const getStatusCode = require("../Utils/statusCodeMapping");

const register = async (req, res) => {
  let { email, password, passwordCheck, userName, referredBy, phoneNumber } =
    req.body;

  // validate

  if (!email || !password || !passwordCheck || !userName || !phoneNumber) {
    return res.status(400).json({ msg: "Not all fields have been entered." });
  }
  if (phoneNumber.length != "11")
    return res.status(400).json({ msg: "Please enter a valid phone number" });
  if (password.length < 5)
    return res
      .status(400)
      .json({ msg: "The password needs to be at least 5 characters long." });
  if (password !== passwordCheck)
    return res
      .status(400)
      .json({ msg: "Enter the same password twice for verification." });

  try {
    const existingUserEmail = await User.findOne({ email: email });

    if (existingUserEmail)
      return res
        .status(400)
        .json({ msg: "An account with this email already exists." });
    const existingUsername = await User.findOne({ userName: userName });
    if (existingUsername)
      return res.status(400).json({ msg: "This username has been taken" });
    // generate API token for the user

    // If user does not exist
    if (!existingUserEmail && !existingUsername) {
      req.body.apiToken = randomToken.generate(30);

      // generate account number
      // await generateAcc({ userName, email });

      if (referredBy) await newReferral(req.body);

      // Create user
      const user = await User.create({ ...req.body });

      // Create JWT
      const token = user.createJWT();

      return res.status(200).json({
        status: res.statusCode,
        status_code: getStatusCode(res.statusCode),
        token: token,
        data: { ...user._doc },
        msg: "User registered successfully",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      error: error.message,
      msg: error.message,
    });
  }
};
const login = async (req, res) => {
  const { userName, password } = req.body;

  try {
    if (!userName || !password)
      return res.status(400).json({ msg: "Not all fields have been entered." });
    let user = await User.findOne({ userName: userName });
    if (!user) user = await User.findOne({ email: userName });
    if (!user)
      return res
        .status(400)
        .json({ msg: "No account with this detail has been registered." });
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect)
      return res.status(400).json({ msg: "Incorrect password" });
    // generate account number
    // if (user.accountNumbers.length < 1)
    // await generateAcc({ userName, email: user.email });

    const token = user.createJWT();

    if (!user.apiToken) {
      const generatedRandomToken = randomToken.generate(30);
      console.log(generatedRandomToken);
      await User.updateOne(
        { email: user.email },
        { $set: { apiToken: generatedRandomToken } },
        { new: true, runValidators: true }
      );
      user.apiToken === generatedRandomToken;
    }

    return res.status(200).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      token: token,
      data: { ...user._doc },
      msg: "Login successful",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      error: error.message,
      msg: error.message,
      msg: error.message,
    });
  }
};

const userData = async (req, res) => {
  // return details of the user and purchase objects
  const { userId, userType } = req.user;
  const isReseller = userType === "reseller";
  const isApiUser = userType === "api user";

  try {
    console.log({ userId });
    let user = await User.findOne({ _id: userId });

    res.status(200).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      data: { ...user._doc },
      msg: "User details fetched successfully",
    });

    // const data = await Data.find();
    // console.log(data);
    // const userTransaction = await Transaction.find({ trans_By: userId })
    //   .limit(10)
    //   .sort("-createdAt");
    // const allDataList = await Data.find().sort("dataplan_id");
    // const allDataList = MTN_SME;

    // const MTN_SME_PRICE = allDataList
    //   .filter((e) => e.plan_network === "MTN")
    //   .map((e) => {
    //     const { resellerPrice, my_price, id } = e;
    //     let price = my_price;

    //     if (isReseller || isApiUser) {
    //       price = resellerPrice;
    //     }
    //     e["plan_amount"] = price;
    //     return e;
    //   });

    // const GLO_PRICE = allDataList
    //   .filter((e) => e.plan_network === "GLO")
    //   .map((e) => {
    //     const { my_price, resellerPrice } = e;
    //     let price = my_price;

    //     if (isReseller || isApiUser) {
    //       price = resellerPrice;
    //     }
    //     e["plan_amount"] = price;
    //     return e;
    //   });
    // const AIRTEL_PRICE = allDataList
    //   .filter((e) => e.plan_network === "AIRTEL")
    //   .map((e) => {
    //     const { my_price, resellerPrice } = e;
    //     let price = my_price;

    //     if (isReseller || isApiUser) {
    //       price = resellerPrice;
    //     }
    //     e["plan_amount"] = price;
    //     return e;
    //   });
    // const NMOBILE_PRICE = allDataList
    //   .filter((e) => e.plan_network === "9MOBILE")
    //   .map((e) => {
    //     const { my_price, resellerPrice } = e;
    //     let price = my_price;

    //     if (isReseller || isApiUser) {
    //       price = resellerPrice;
    //     }
    //     e["plan_amount"] = price;
    //     return e;
    //   });
    // const CABLETV = await cabletvModel.find({});
    // if (user.apiToken === undefined) {
    //   const generatedRandomToken = randomToken.generate(30);
    //   await User.updateOne(
    //     { email: user.email },
    //     { $set: { apiToken: generatedRandomToken } },
    //     { new: true, runValidators: true }
    //   );
    //   user.apiToken === generatedRandomToken;
    // }

    // res.status(200).json({
    //   user,
    //   transactions: userTransaction,
    //   isAdmin: userId === process.env.ADMIN_ID ? true : false,
    //   isCouponVendor:
    //     userId === process.env.COUPON_VENDOR_FAIZ ||
    //     userId === process.env.COUPON_VENDOR_YUSUF
    //       ? true
    //       : false,
    //   subscriptionPlans: {
    //     MTN: MTN_SME_PRICE,
    //     GLO: GLO_PRICE,
    //     AIRTEL: AIRTEL_PRICE,
    //     NMOBILE: NMOBILE_PRICE,
    //     CABLETV: CABLETV,
    //     CABLENAME: cableName,
    //     DISCO: disco,
    //     NETWORK: network,
    //   },
    // });
  } catch (error) {
    res.status(500).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: "An error occur",
    });
  }
};

const updateUser = async (req, res) => {
  const {
    user: { userId },
    params: { id },
  } = req;
  if (id !== userId)
    return res
      .status(401)
      .json({ msg: "You are not allowed to update this user" });
  // if (req.body.userType && req.body.userType !== "reseller") {

  // const resellerAmount = 1000;
  // Get the upgradedAmount from the settings
  const { upgradeAmount: resellerAmount } = await Settings.findOne();

  if (
    resellerAmount === undefined ||
    resellerAmount === null ||
    resellerAmount === 0
  )
    return res.status(400).json({ msg: "upgrade amount not set" });
  // console.log(resellerAmount);
  const user = await User.findOne({ _id: userId });
  // console.log(user);
  if (user.userType === req.body.userType)
    return res.status(400).json({ msg: "You are already a reseller" });
  if (user.balance < resellerAmount)
    return res.status(400).json({ msg: "Insufficient balance" });
  // console.log("here");
  await User.updateOne(
    { _id: userId },
    {
      $inc: {
        balance: -resellerAmount,
      },
    }
  );
  const upgradeTransaction = Transaction({
    trans_Id: uuid(),
    trans_By: userId,
    trans_Type: "wallet",
    trans_Network: "upgrade",
    phone_number: `upgrade to ${req.body.userType}`,
    trans_amount: resellerAmount,
    balance_Before: user.balance,
    balance_After: user.balance - resellerAmount,
    trans_Date: `${new Date().toDateString()} ${new Date().toLocaleTimeString()}`,
    trans_Status: "success",
    createdAt: Date.now(),
  });

  await upgradeTransaction.save();
  await User.updateOne(
    { _id: userId },
    { ...req.body },
    { runValidators: true }
  );

  res.status(200).json({ msg: "user updated successfully" });
  if (user.referredBy) {
    const referralBonus = 500;
    const referrer = await User.findOne({ userName: user.referredBy });
    if (!referrer) return;
    await BONUS_RECEIPT({ referrer, user, referralBonus });
    await User.updateOne(
      { _id: referrer._id },
      { $inc: { balance: referralBonus } }
    );
  }
  return;
};
const upgradeUser = async (req, res) => {
  const {
    user: { userId },
    params: { id },
  } = req;
  if (id !== userId)
    return res
      .status(401)
      .json({ msg: "You are not allowed to update this user" });
  // if (req.body.userType && req.body.userType !== "reseller") {

  // const resellerAmount = 1000;

  // Get the upgradedAmount from the settings
  const { resellerUserUpgradeAmount: resellerAmount } =
    await Settings.findOne();

  if (
    resellerAmount === undefined ||
    resellerAmount === null ||
    resellerAmount === 0
  )
    return res.status(400).json({ msg: "upgrade amount not set" });
  // console.log(resellerAmount);
  const user = await User.findOne({ _id: userId });
  // console.log(user);
  if (user.userType === req.body.userType)
    return res.status(400).json({ msg: "You are already a reseller" });
  if (user.balance < resellerAmount)
    return res.status(400).json({ msg: "Insufficient balance" });
  // console.log("here");
  await User.updateOne(
    { _id: userId },
    {
      $inc: {
        balance: -resellerAmount,
      },
    }
  );
  const upgradeTransaction = Transaction({
    trans_Id: uuid(),
    trans_By: userId,
    trans_Type: "wallet",
    trans_Network: "upgrade",
    phone_number: `upgrade to ${req.body.userType}`,
    trans_amount: resellerAmount,
    balance_Before: user.balance,
    balance_After: user.balance - resellerAmount,
    trans_Date: `${new Date().toDateString()} ${new Date().toLocaleTimeString()}`,
    trans_Status: "success",
    createdAt: Date.now(),
  });

  await upgradeTransaction.save();
  await User.updateOne(
    { _id: userId },
    { ...req.body },
    { runValidators: true }
  );

  res.status(200).json({ msg: "user updated successfully" });
  if (user.referredBy) {
    const referralBonus = 500;
    const referrer = await User.findOne({ userName: user.referredBy });
    if (!referrer) return;
    await BONUS_RECEIPT({ referrer, user, referralBonus });
    await User.updateOne(
      { _id: referrer._id },
      { $inc: { balance: referralBonus } }
    );
  }
  return;
};
const deleteUser = async (req, res) => {
  const {
    user: { userId },
    params: { id },
  } = req;
  if (id !== userId)
    return res
      .status(401)
      .json({ msg: "You are not allowed to delete this user" });
  try {
    await User.findByIdAndDelete(userId);
    res.json({ msg: "user deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
const validateToken = async (req, res) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.json(false);

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) return res.json(false);

    const user = await User.findById(verified.userId);
    if (!user) return res.json(false);
    await User.updateOne(
      { _id: user.id },
      { $currentDate: { lastLogin: true } }
    );
    return res.json(true);
  } catch (err) {
    // console.log(err);
    res.status(500).json({ msg: err.message });
  }
};
const requestPasswordReset = async (req, res) => {
  // res.status(200).json({ msg: "password reet successful" });
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: "Please provide email" });
  const user = await User.findOne({ email: email });

  if (!user)
    return res
      .status(400)
      .json({ msg: "No account with this email has been registered." });
  try {
    let token = await Token.findOne({ userId: user._id });
    if (token)
      return res.status(400).json({
        msg: "You just requested a password reset please check your email or try again later",
      });
    let resetToken = crypto.randomBytes(32).toString("hex");
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(resetToken, salt);
    await new Token({
      userId: user._id,
      token: hash,
      createdAt: Date.now(),
    }).save();

    const link = `${process.env.FRONTEND_URL}/passwordReset/${resetToken}/${user._id}`;
    sendEmail(
      user.email,
      "Password Reset Request",
      { name: user.fullName, link: link },
      "../templates/requestResetPassword.handlebars"
    );

    return res.status(200).json({
      msg: "An email has been sent to you. Kindly check your email. Check spam folder if not found",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({ msg: "An error occcured" });
  }
};
const resetPassword = async (req, res) => {
  const { token, userId, newPassword, newPasswordCheck } = req.body;
  if (!newPassword || !newPasswordCheck || !token || !userId)
    return res.status(400).json({ msg: "All fields are required" });
  if (newPassword !== newPasswordCheck)
    return res
      .status(400)
      .json({ msg: "Enter the same password for verification" });
  try {
    let passwordResetToken = await Token.findOne({ userId });
    if (!passwordResetToken)
      return res
        .status(400)
        .json({ msg: "Invalid or expired password reset token" });
    const isValid = await bcrypt.compare(token, passwordResetToken.token);

    if (!isValid)
      return res
        .status(400)
        .json({ msg: "Invalid or expired password reset token" });

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(newPassword, salt);
    await User.updateOne({ _id: userId }, { $set: { password: hash } });
    const user = await User.findById({ _id: userId });
    sendEmail(
      user.email,
      "Password Reset Successful",
      {
        name: user.fullName,
        link: process.env.FRONTEND_URL,
      },
      "../templates/resetPassword.handlebars"
    );
    await passwordResetToken.deleteOne();
    return res
      .status(200)
      .json({ msg: "You have successfully reset your password" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "An error occcured" });
  }
};
const requestPinReset = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: "Please provide email" });
  const user = await User.findOne({ email: email });

  if (!user)
    return res
      .status(400)
      .json({ msg: "No account with this email has been registered." });
  try {
    let token = await Token.findOne({ userId: user._id });
    // if (token) await token.deleteOne();
    if (token)
      return res.status(400).json({
        msg: "You just requested a pin reset please check your email or try again later",
      });
    let resetToken = crypto.randomBytes(32).toString("hex");
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(resetToken, salt);
    await new Token({
      userId: user._id,
      token: hash,
      createdAt: Date.now(),
    }).save();

    const link = `${process.env.FRONTEND_URL}/pinReset/${resetToken}/${user._id}`;
    sendEmail(
      user.email,
      "Transaction Pin Reset Request",
      { name: user.fullName, link: link },
      "../templates/requestResetPin.handlebars"
    );

    return res.status(200).json({
      msg: "An email has been sent to you. Kindly check your email. Check spam folder if not found",
    });
  } catch (error) {
    console.log(error);
  }
};

const resetPin = async (req, res) => {
  const { token, userId, newPin, newPinCheck } = req.body;
  if (!newPin || !newPinCheck || !token || !userId)
    return res.status(400).json({ msg: "All fields are required" });
  if (newPin !== newPinCheck)
    return res
      .status(400)
      .json({ msg: "Enter the same password for verification" });
  try {
    let passwordResetToken = await Token.findOne({ userId });
    if (!passwordResetToken)
      return res
        .status(400)
        .json({ msg: "Invalid or expired password reset token" });
    const isValid = await bcrypt.compare(token, passwordResetToken.token);

    if (!isValid)
      return res
        .status(400)
        .json({ msg: "Invalid or expired password reset token" });

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(newPin, salt);
    await User.updateOne({ _id: userId }, { $set: { userPin: hash } });
    const user = await User.findById({ _id: userId });
    sendEmail(
      user.email,
      "Transaction pin reset successful",
      {
        name: user.fullName,
        link: process.env.FRONTEND_URL,
      },
      "../templates/pinReset.handlebars"
    );
    await passwordResetToken.deleteOne();
    return res
      .status(200)
      .json({ msg: "You have successfully reset your pin" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "An error occcured" });
  }
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword, newPasswordCheck } = req.body;
  const user = await User.findById(req.user.userId);
  if (!(oldPassword, newPassword, newPasswordCheck))
    return res.status(400).json({ msg: "All fields are required" });
  if (oldPassword === newPassword)
    return res.status(400).json({
      msg: "You cannot use your old password.Kindly use a new password",
    });
  if (newPassword !== newPasswordCheck)
    return res
      .status(400)
      .json({ msg: "Enter the same password for verification" });

  const isOldPasswordMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isOldPasswordMatch)
    return res.status(400).json({ msg: "Your old password is wrong" });
  try {
    const salt = await bcrypt.genSalt();
    const newPasswordHash = await bcrypt.hash(newPassword, salt);
    await User.updateOne(
      { _id: req.user.userId },
      { $set: { password: newPasswordHash } }
    );
    return res.status(200).json({ msg: "Password Changed successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "An error occured" });
  }
};

const validateUser = async (req, res) => {
  try {
    let user = await User.findOne({ userName: req.params.userName });
    if (!user) user = await User.findOne({ email: req.params.userName });
    if (!user) return res.status(404).json({ msg: "user does not exist" });
    return res.status(200).json({ msg: user.email });
  } catch (error) {
    console.log(error);
  }
};
// Contacts controller

const fetchContact = async (req, res) => {
  const { userId } = req.user;
  try {
    const { _id } = await User.findById(userId);
    const contactList = await Contact.find({ userId: _id }).sort("-createdAt");
    res.status(200).json({ msg: "contact list fetched", contactList });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "something went wrong" });
  }
};
const addContact = async (req, res) => {
  const { userId } = req.user;
  const { contactName, contactNumber, contactNetwork } = req.body;
  if (!contactName || !contactNumber || !contactNetwork)
    return res.status(400).json({ msg: "all fields are required" });
  if (contactName.length > 11)
    return res
      .status(400)
      .json({ msg: "max length for contact name is 11 character " });
  if (contactNumber.length !== 11)
    return res.status(400).json({ msg: "Enter a valid number" });
  try {
    const { _id } = await User.findById(userId);
    const totalContact = await Contact.countDocuments({ userId: _id });
    if (totalContact >= 10)
      return res
        .status(400)
        .json({ msg: "Max number of contact reached, please delete some " });
    // creating the contact
    const isContactExist = await Contact.findOne({
      userId: _id,
      contactNumber,
    });
    if (isContactExist)
      return res.status(400).json({ msg: "This number is saved already" });
    await Contact.create({ userId: _id, ...req.body, createdAt: Date.now() });

    res.status(201).json({ msg: "Contact added" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "something went wrong" });
  }
};
const updateContact = async (req, res) => {
  const { contactName, contactNumber, contactNetwork } = req.body;
  const { userId } = req.user;
  if (!contactName || !contactNumber || !contactNetwork)
    return res.status(400).json({ msg: "all fields are required" });
  if (contactName.length > 11)
    return res
      .status(400)
      .json({ msg: "max length for contact name is 11 character " });
  if (contactNumber.length !== 11)
    return res.status(400).json({ msg: "Enter a valid number" });
  try {
    const { _id } = await User.findById(userId);
    const contactToUpdate = await Contact.findById(req.params.contactId);
    await Contact.updateOne(
      {
        userId: _id,
        _id: contactToUpdate._id,
      },
      { $set: { ...req.body, createdAt: Date.now() } }
    );
    res.status(200).json({ msg: "Contact updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "something went wrong" });
  }
};
const deleteContact = async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.contactId);
    res.status(200).json({ msg: "Contact deleted " });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "something went wrong" });
  }
};
const updateWebhookUrl = async (req, res) => {
  const { webhookUrl } = req.body;
  console.log(webhookUrl);
  const startWithHttps = webhookUrl.startsWith("https://");
  if (!startWithHttps)
    return res.status(400).json({ msg: "must start with https://" });
  try {
    await User.updateOne({ _id: req.user.userId }, { $set: { webhookUrl } });
    return res.status(200).json({ msg: "webhook updated successfully" });
  } catch (error) {
    return res.status(500).json({ msg: "something went wrong" });
  }
};
const updateKyc = async (req, res) => {
  const { userId } = req.user;
  const { nin: ninNo, bvn: bvnNo } = req.body;
  const {
    MONNIFY_API_URL,
    // MONNIFY_API_ENCODED,
    MONNIFY_API_KEY,
    MONNIFY_API_SECRET,
  } = process.env;
  if (!ninNo && !bvnNo) {
    return res.status(400).json({ msg: "Please provide Bvn/Nin" });
  }

  const { userName, email, bvn, nin, accountNumbers } = await User.findOne({
    _id: userId,
  });
  if (bvn || nin)
    return res.status(400).json({ msg: "You have done your KYC before" });
  if (accountNumbers.length < 1) {
    const response = await generateAcc({
      userName,
      email,
      bvn: bvnNo,
      nin: ninNo,
    });
    // console.log(response);
    if (!response.status) {
      return res.status(400).json({ msg: response.msg });
    } else {
      const kycDetails = {
        fullName: response.msg,
        bvn: bvnNo,
        nin: ninNo,
      };
      // console.log("here");
      const isUpdated = await User.updateOne(
        { _id: userId },
        { $set: { ...kycDetails } }
      );
      console.log({ isUpdated });
      return res.status(200).json({ msg: response.msg });
    }
  }
  const ApiKeyEncoded = Buffer.from(
    MONNIFY_API_KEY + ":" + MONNIFY_API_SECRET
  ).toString("base64");
  const response = await axios.post(
    `${MONNIFY_API_URL}/api/v1/auth/login`,
    {},
    {
      headers: {
        Authorization: `Basic ${ApiKeyEncoded}`,
      },
    }
  );
  const {
    responseBody: { accessToken },
  } = response.data;
  console.log({ userName });
  const updateKYC = async (reference) => {
    let result = {};
    try {
      const accountDetails = await axios.put(
        `${MONNIFY_API_URL}/api/v1/bank-transfer/reserved-accounts/${reference}/kyc-info`,
        { ...req.body },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const { accountName } = accountDetails.data.responseBody;

      if (accountDetails.status == 200) {
        result.status = true;
        result.msg = accountName;
      }
    } catch (error) {
      console.log({ statusCode: error.response.status });
      result.status = false;
      result.msg = error.response.data.responseMessage;
      result.statusCode = error.response.status;
    }
    console.log({ reference, result });
    return result;
  };
  let responseObject = await updateKYC(email);

  if (!responseObject.status && responseObject.statusCode != 422) {
    console.log("first");
    //422 means invalid id no provided
    responseObject = await updateKYC(userName);
  }
  if (responseObject.status) {
    const kycDetails = {
      fullName: responseObject.msg,
      bvn: bvnNo,
      nin: ninNo,
    };
    // console.log("here");
    const isUpdated = await User.updateOne(
      { _id: userId },
      { $set: { ...kycDetails } }
    );
    console.log({ isUpdated });
    return res
      .status(200)
      .json({ msg: `${kycDetails.fullName} has been added as your full name` });
  } else {
    return res.status(500).json({ msg: responseObject.msg });
  }
};
module.exports = {
  register,
  login,
  updateUser,
  deleteUser,
  validateToken,
  userData,
  requestPasswordReset,
  resetPassword,
  requestPinReset,
  resetPin,
  changePassword,
  validateUser,
  addContact,
  deleteContact,
  fetchContact,
  updateContact,
  updateWebhookUrl,
  updateKyc,
  upgradeUser,
};
