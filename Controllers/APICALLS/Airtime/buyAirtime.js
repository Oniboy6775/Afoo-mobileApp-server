const axios = require("axios");

const buyAirtime = async ({ network, mobile_number, amount }) => {
  let networkId = "";
  // let message = "";
  const availableNetworks = {
    1: { id: 1, name: "MTN" },
    2: { id: 2, name: "GLO" },
    3: { id: 3, name: "AIRTEL" },
    4: { id: 4, name: "9MOBILE" },
  };
  const isPlanExist = availableNetworks.hasOwnProperty(network);
  if (!isPlanExist) return { status: false, msg: "Invalid plan Id" };
  networkId = availableNetworks[network];
  try {
    const response = await axios.post(
      `${process.env.DATARELOADED_API}/buy/airtime`,
      {
        network: networkId.id,
        mobile_number: mobile_number,
        amount: amount,
      },
      {
        headers: {
          Authorization: process.env.DATARELOADED_API_KEY,
          "x-auth-apikey": process.env.DATARELOADED_API_KEY,
        },
      }
    );
    return {
      status: true,
      msg: response.data.msg || `${networkId.name} airtime purchase successful`,
      apiResponseId: response.data.apiResponseId,
      apiResponse: response.data.msg,
    };
  } catch (error) {
    return {
      status: false,
      msg: error.response.data.msg,
      apiResponse: error.response.data?.apiResponse || "",
    };
  }
};
module.exports = buyAirtime;
