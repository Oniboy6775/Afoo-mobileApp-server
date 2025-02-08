const axios = require("axios");

const buyAirtime = async ({
  network,
  mobile_number,
  amount,
  transactionId,
}) => {
  let networkId = "";
  const availableNetworks = {
    1: { id: "1", name: "MTN" },
    2: { id: "3", name: "GLO" },
    3: { id: "2", name: "AIRTEL" },
    4: { id: "4", name: "9MOBILE" },
  };
  console.log({ network, selectedNetwork: availableNetworks[network].name });
  const isPlanExist = availableNetworks.hasOwnProperty(network);
  if (!isPlanExist) return { status: false, msg: "Invalid plan Id" };
  networkId = availableNetworks[network];
  //AUTOPILOT MY SIM
  try {
    const BuyAirtimeResponse = await axios.post(
      `${process.env.AUTOPILOT_URL}/airtime`,
      {
        networkId: networkId.id,
        airtimeType: "VTU",
        amount: parseInt(amount),
        phone: mobile_number,
        reference: transactionId,
        accessPin: process.env.AUTOPILOT_ACCESS_PIN,
      },
      {
        headers: {
          Authorization: process.env.AUTOPILOT_API_KEY,
        },
      }
    );
    let apiResponse;
    apiResponse = BuyAirtimeResponse.data.data.message;
    const apiResponseId =
      BuyAirtimeResponse.data && BuyAirtimeResponse.data.data.reference;
    if (!BuyAirtimeResponse.data.status)
      return {
        status: false,
        supplier: "AUTOPILOT",
        msg: BuyAirtimeResponse.data.data.message || "Transaction failed",
        apiResponseId: apiResponseId || "",
        apiResponse: BuyAirtimeResponse.data.data.message || "",
      };
    if (
      BuyAirtimeResponse.data.data.message.startsWith(
        "Invalid/unmapped error from"
      )
    ) {
      return {
        status: false,
        supplier: "AUTOPILOT",
        msg: "Transaction failed. Try again later",
        apiResponseId: apiResponseId || "",
        apiResponse: BuyAirtimeResponse.data.data.message || "",
      };
    }
    return {
      status: true,
      supplier: "AUTOPILOT",
      msg:
        BuyAirtimeResponse.data.data.message ||
        `Data purchase for ${mobile_number} was successful`,
      apiResponseId: apiResponseId || "",
      apiResponse: BuyAirtimeResponse.data.data.message || "",
    };
  } catch (error) {
    let errorMsg = error.response.data.data.message;
    return {
      status: false,
      supplier: "AUTOPILOT",
      msg: errorMsg || "Transaction failed",
      apiResponse: errorMsg || "",
    };
  }
  // }
  // else
  //   try {
  //     const response = await axios.post(
  //       `${process.env.GLADITINGSDATA_API}/topup/`,
  //       {
  //         network: networkId.id,
  //         mobile_number: mobile_number,
  //         amount: amount,
  //         Ported_number: true,
  //         airtime_type: "VTU",
  //       },
  //       {
  //         headers: {
  //           Authorization: process.env.GLADITINGSDATA_TOKEN,
  //         },
  //       }
  //     );

  //     const apiResponseId = response.data && response.data.ident;
  //     // console.log(response.data);
  /**
     * {
  id: 900072,
  airtime_type: 'VTU',
  ident: '10c67fd822',
  network: 1,
  paid_amount: '96.5',
  mobile_number: '08108126121',
  amount: '100',
  plan_amount: '100',
  plan_network: 'MTN',
  balance_before: '11283.196849999978',
  balance_after: '11186.696849999978',
  Status: 'successful',
  create_date: '2023-07-04T17:49:54.025731',
  Ported_number: true
}
     * 
     */
  //   return {
  //     status: true,
  //     msg: `You have successfully purchased ₦${amount} airtime for ${mobile_number}`,
  //     apiResponseId,
  //   };
  // } catch (error) {
  //   console.log(error.response);
  //   let errText = error.response.data.error[0] || "Transaction failed";
  //   return { status: false, msg: errText };
  // }
};
module.exports = buyAirtime;
