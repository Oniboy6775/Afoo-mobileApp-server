const axios = require("axios");

const buyElectricity = async ({
  meterId,
  amount,
  meterNumber,
  address,
  meterOwner,
  meterType,
}) => {
  // return { status: true, msg: "successful purchase token" };
  try {
    const BuyDataResponse = await axios.post(
      `${process.env.GLADITINGSDATA_API}/billpayment/`,
      {
        disco_name: meterId,
        amount,
        Customer_Phone: "08108135121",
        meter_number: meterNumber,
        MeterType: meterType === "prepaid" ? "Prepaid" : "Postpaid",
        customer_address: address,
        customer_name: meterOwner,
      },
      {
        headers: {
          Authorization: process.env.GLADITINGSDATA_TOKEN,
        },
      }
    );
    if (BuyDataResponse.data.Status === "failed")
      return { status: false, msg: "Transaction failed" };
    return {
      status: true,
      token: BuyDataResponse.data.token,
      msg: "Electricity token purchase successful",
    };
  } catch (error) {
    return { status: false, msg: "Transaction failed" };
  }
};
module.exports = buyElectricity;
