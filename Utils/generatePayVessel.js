const { default: axios } = require("axios");
const User = require("../Models/usersModel");

const generatePayVessel = async ({ email, userName, phoneNumber }) => {
  const headers = {
    "api-key": process.env.PAYVESSEL_API_KEY,
    "api-secret": `Bearer ${process.env.PAYVESSEL_API_SECRET}`,
    "Content-Type": "application/json",
  };

  const payload = {
    email,
    name: userName,
    phoneNumber,
    bankcode: ["120001"],
    account_type: "STATIC",
    businessid: process.env.PAYVESSEL_BUSINESS_ID,
    bvn: "",
  };
  try {
    const accountResponse = await axios.post(
      `${process.env.PAYVESSEL_URL}/external/request/customerReservedAccount/`,
      { ...payload },
      { headers: { ...headers } }
    );
    // console.log(accountResponse);
    const { status, banks } = accountResponse.data;
    if (status) {
      return User.updateOne(
        { email },
        {
          // $set: {
          //   reservedAccountBank4: banks[0].bankName,
          //   reservedAccountNo4: banks[0].accountNumber,
          // },
          $push: {
            accountNumbers: banks,
          },
        }
      );
    } else {
      console.log("Unable to create an account for " + userName);
    }
  } catch (e) {
    // console.log(e);
  }
};
module.exports = generatePayVessel;
