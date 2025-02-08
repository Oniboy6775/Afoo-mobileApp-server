const { sendPushNotification } = require("./expo/notification");
const balanceLimit = {
  GLAD: 5000,
  GLAD2: 100,
  LEGIT: 5000,
  DATALANE: 5000,
  UASUBPOINT: 3000,
  "9JADATASUB": 500,
  "SIM-SERVER": 100,
};
const checkAdminBalance = ({ adminNewBalance, supplierName }) => {
  // console.log({ supplierName, adminNewBalance });
  const availableBalanceLimit = balanceLimit[supplierName] || 5000;
  if (adminNewBalance > availableBalanceLimit) return;
  sendPushNotification({
    title: "BALANCE LOW",
    body: `Your balance is low on ${supplierName}, currently ₦${adminNewBalance} `,
    pushTokens: [
      "ExponentPushToken[0TMSfQC_FSh9VlkmAfJrpw]",
      "ExponentPushToken[aaBqopItZ1hiMm_8Pw-0xn]",
    ],
  });
};

module.exports = { checkAdminBalance };
