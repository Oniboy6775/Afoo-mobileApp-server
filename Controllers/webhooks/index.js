const Transactions = require("../../Models/transactionModel");
const User = require("../../Models/usersModel");
const { REFUND_RECEIPT } = require("../TransactionReceipt");
const axios = require("axios");
const generateReceipt = require("../generateReceipt");
const crypto = require("crypto");
const pushNotificationModel = require("../../Models/pushNotificationModel");
const { sendPushNotification } = require("../../Utils/expo/notification");
const md5 = require("md5");

const gladWebhook = async (req, res) => {
  res.sendStatus(200);
  console.log(req.body);
  const { mobile_number, ident, refund, api_response } = req.body;
  try {
    const thisTransaction = await Transactions.findOne({
      phone_number: mobile_number,
      apiResponseId: ident,
    });
    console.log(thisTransaction);
    if (!thisTransaction) return;
    const { trans_Id, trans_By, trans_Status, trans_amount } = thisTransaction;
    if (trans_Status === "refunded") return;
    // if there's a refund api response
    if (`refund`) {
      const { balance } = await User.findOne({ _id: trans_By });
      // generate a refund receipt
      await REFUND_RECEIPT({
        ...thisTransaction._doc,
        balance,
        isOwner: true,
      });
      // refund the user back
      await User.updateOne(
        { _id: trans_By },
        { $inc: { balance: trans_amount } }
      );
      // update the old transaction status
      await Transactions.updateOne(
        { trans_Id },
        {
          $set: {
            trans_Status: "refunded",
            apiResponseId: "",
            apiResponse: api_response,
            trans_volume_ratio: 0,
            trans_profit: 0,
          },
        }
      );
    } else {
      // update the transaction api response
      if (api_response) {
        await Transactions.updateOne(
          { trans_Id },
          { $set: { apiResponseId: "", apiResponse: api_response } }
        );
      }
    }

    const { webhookUrl } = await User.findOne({
      _id: trans_By,
    });
    if (webhookUrl) {
      // send a notification webhook to owner of wallet that their money has been refunded or updated
      const response = await axios.post(webhookUrl, {
        ...req.body,
      });
      console.log(response);
    }
  } catch (error) {
    console.log(error);
    return;
  }
};
const payVessel = async (req, res) => {
  res.status(200).json({ message: "success" });
  try {
    // console.log({ ...req.headers });
    const payload = req.body;
    const payvessel_signature = req.header["payvessel-http-signature"];
    const ip_address = req.headers["true-client-ip"];
    const secret = process.env.PAYVESSEL_API_SECRET;
    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(payload))
      .digest("hex");
    console.log({ hash, payvessel_signature, ip_address, secret });
    // if (payvessel_signature === hash && ip_address === "162.246.254.36") {
    if (ip_address === "162.246.254.36") {
      const data = payload;
      const amount = parseFloat(data.order.amount);
      const settlementAmount = parseFloat(data.order.settlement_amount);
      const fee = parseFloat(data.order.fee);
      const reference = data.transaction.reference;
      const description = data.order.description;
      const email = data.customer.email;
      const accountNumber = data.virtualAccount.virtualAccountNumber;
      const user = await User.findOne({ email });
      if (!email) return;
      const fundedTransaction = await Transactions.findOne({
        trans_Id: reference,
      });
      // Check if reference already exists in your payment transaction table
      if (!fundedTransaction) {
        // Fund user wallet here
        await User.updateOne(
          { email },
          { $inc: { balance: settlementAmount } }
        );
        //create a transaction history
        await generateReceipt({
          transactionId: reference,
          planNetwork: "Auto-funding||PayVessel",
          status: "success",
          planName: `₦${amount}`,
          phoneNumber: accountNumber,
          amountToCharge: settlementAmount,
          balance: user.balance,
          userId: user._id,
          userName: user.userName,
          type: "wallet",
          response: description,
          increased: true,
          // wavedAmount: userToCredit.userType === "api user" ? 0 : -totalCharges,
        });
        // send push notification
        const notificationExist = await pushNotificationModel.findOne({
          userId: user._id,
          pushIsActive: true,
        });
        if (notificationExist)
          sendPushNotification({
            title: "Payment successful",
            body: `Your wallet has been funded with ${settlementAmount}`,
            pushTokens: [notificationExist.pushToken],
          });
        /**
       * {
  transaction: {
    date: '2024-01-25T14:19:09',
    reference: '090267240125141854757101689792',
    sessionid: '090267240125141854757101689792'
  },
  order: {
    currency: 'NGN',
    amount: 100,
    settlement_amount: 70,
    fee: 30,
    description: 'Inbound Transfer From ABDULAHI KOLAWOLE ONISABI/Kuda Microfinance bank to Reloadeddata-oniboy/5186092209-9Payment Service Bank'
  },
  customer: { email: 'onisabiabdullahi@gmail.com', phone: '08108126121' },
  virtualAccount: { virtualAccountNumber: '5186092209', virtualBank: '120001' },
  sender: {
    senderAccountNumber: '1101689792',
    SenderBankCode: '090267',
    senderBankName: 'Kuda Microfinance bank',
    senderName: 'ABDULAHI KOLAWOLE ONISABI'
  },
  message: 'Success',
  code: '00'
}
 * 
 * 
 */
      } else {
        console.log("the transaction has been funded before");
        return;
      }
    } else {
      console.log("Permission denied");
      return;
    }
  } catch (e) {
    console.log(e);
  }
};
const autoPilot = async (req, res) => {
  res.sendStatus(200);

  // {
  // status: true,
  // code: 200,
  // data: {
  //   type: 'Data',
  //   message: "Y'ello! You have gifted 1GB to 2349163634970. Share link https://mtnapp.page.link/myMTNNGApp with 2349163634970 to download the new MyMTN app for exciting offers.. Sender number: 08108126121",
  //   yourReference: '2024-DATA-3434489c-8ff9-466a',
  //   ourReference: 'EAZY202424060714311RSHR731'
  // },
  //   time: '2024-24-06 07:15:16'
  // }
  const { data, status } = req.body;
  // const isSuccess = data.message.startsWith("Y'ello! You have gifted");
  // console.log({ isSuccess });
  try {
    await Transactions.updateOne(
      { trans_Id: data.yourReference },
      {
        $set: {
          apiResponse: `${data.message}.${
            data.message.startsWith("Sorry, you have reached your daily")
              ? "FAILED"
              : "Send '2' To '323' Via Sms To Check Data Balance"
          } `,
        },
      }
    );
    console.log("AUTO PILOT TRANSACTION API RESPONSE UPDATED");
    // let isRefund =
    //   data.message.startsWith("Sorry, you have reached your daily") ||
    //   data.message.startsWith("Transaction failed;") ||
    //   data.message.startsWith("Request was canceled");
    // if (isRefund) {
    //   const oldTransactionDetails = await Transactions.findOne({
    //     trans_Id: data.yourReference,
    //   });
    //   // console.log(oldTransactionDetails);
    //   await User.updateOne(
    //     { _id: oldTransactionDetails.trans_By },
    //     { $inc: { balance: oldTransactionDetails.trans_amount } }
    //   );
    //   await Transactions.updateOne(
    //     { trans_Id: data.yourReference },
    //     {
    //       $set: {
    //         apiResponse:
    //           data.message || "Transaction failed and has been refunded",
    //         trans_Status: "refunded",
    //       },
    //     }
    //   );
    //   // REFUND RECEIPT
    //   const user = await User.findOne({ _id: oldTransactionDetails.trans_By });
    //   console.log(user);
    //   await REFUND_RECEIPT({
    //     ...oldTransactionDetails._doc,
    //     balance: user.balance,
    //     isOwner: true,
    //   });
    // }
  } catch (error) {
    console.log(error);
  }
};
const billStack = async (req, res) => {
  res.sendStatus(200);
  // console.log(req.body);
  // console.log(req.headers);
  const signature = req.headers["x-wiaxy-signature"];
  const secret = process.env.BILLSTACK_SECRET;
  // write MD5 of a secret key above
  const expectedSignature = md5(secret);
  if (signature !== expectedSignature) {
    console.log({ signature, secret });
    console.log("SIGNATURE NOT CORRECT");
    return;
  }
  if (req.body.data.type == "RESERVED_ACCOUNT_TRANSACTION") {
    const {
      merchant_reference,
      transaction_ref,
      amount,
      account: { account_number, bank_name },
    } = req.body.data;
    const customerEmail = merchant_reference.split("_")[1];
    console.log({ customerEmail });
    let charges = parseFloat(amount) * 0.005;
    if (charges > 50) charges = 50;
    const settlementAmount = (amount - charges).toFixed(2);
    const user = await User.findOne({ email: customerEmail });
    await generateReceipt({
      transactionId: transaction_ref,
      planNetwork: `Auto-funding||${bank_name}`,
      status: "success",
      planName: `₦${amount}`,
      phoneNumber: account_number,
      response: `A payment of ₦${amount} received from ${bank_name} ${account_number}. ₦${settlementAmount} has been credited and ₦${charges} bank charges has been deducted`,
      amountToCharge: Number(settlementAmount),
      balance: user.balance,
      userId: user._id,
      userName: user.userName,
      type: "wallet",
      increased: true,
      // wavedAmount: settlementAmount - amountToCredit,
    });
    await User.updateOne(
      { email: customerEmail },
      { $inc: { balance: settlementAmount } }
    );
  }
};
module.exports = { gladWebhook, payVessel, autoPilot, billStack };
