const axios = require("axios");
require("dotenv").config();
const User = require("../Models/usersModel");

const generateVpayAcc = async ({ email, firstName, lastName, phoneNumber }) => {
  const { VPAY_API_URL, VPAY_USERNAME, VPAY_PASSWORD, VPAY_PUBLIC_KEY } =
    process.env;

  try {
    // axios
    const authFetch = axios.create({
      baseURL: VPAY_API_URL,
    });
    const response = await authFetch.post(
      "/api/service/v1/query/merchant/login",
      { username: VPAY_USERNAME, password: VPAY_PASSWORD },
      { headers: { publicKey: VPAY_PUBLIC_KEY } }
    );
    const token = response.data.token;
    // request;
    authFetch.interceptors.request.use(
      (config) => {
        config.headers.common["b-access-token"] = token;
        config.headers.common["publicKey"] = VPAY_PUBLIC_KEY;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    console.log("generating account number...");

    // GENERATE ACCOUNT NUMBER ID
    // console.log({ email, phoneNumber, firstName, lastName });
    const {
      data: { id: customerId },
    } = await authFetch.post("/api/service/v1/query/customer/add", {
      email: email,
      phone: phoneNumber || "08108126121",
      contactfirstname: firstName,
      contactlastname: lastName,
    });
    // console.log(data);
    console.log("generated!!");
    // GET CUSTOMER BY CUSTOMER ID
    const { data: userDetails } = await authFetch.get(
      `/api/service/v1/query/customer/${customerId}/show`
    );
    // console.log(userDetails);
    //     {
    // [0]   _id: '6411bfa0493727accb5ced4a',
    // [0]   nuban: '4600101056',
    // [0]   email: 'onid@gmail.cm',
    // [0]   phone: 'MDZN_08108126121',
    // [0]   contactfirstname: 'Testing',
    // [0]   contactlastname: 'Testing',
    // [0]   createdon: '2023-03-15T12:52:48.392Z'
    // [0] }
    if (!userDetails.nuban) {
      console.log("account details not available for this user");
      return;
    }
    await User.updateOne(
      { email: email },
      {
        $set: {
          reservedAccountNo3: userDetails.nuban,
          reservedAccountBank3: "VFD microfinance bank",
        },
        $push: {
          accountNumbers: {
            bankName: "VFD microfinance bank",
            accountNumber: userDetails.nuban,
          },
        },
      }
    );
  } catch (e) {
    // console.log({ error: e.response.data });
    return { status: e.response.data.status, msg: e.response.data.message };
  }
};

module.exports = generateVpayAcc;
