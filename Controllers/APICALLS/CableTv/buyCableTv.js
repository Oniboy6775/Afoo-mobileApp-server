const { default: axios } = require("axios");

const buyCable = async ({
  cableName,
  planId,
  customerName,
  smartCardNo,
  transactionId,
}) => {
  const payload = {
    cableType: cableName,
    planId,
    customerName,
    smartCardNo,
    paymentTypes: "FULL_PAYMENT",
    reference: transactionId,
  };
  if (cableName == "SHOWMAX") payload.phoneNo = smartCardNo;
  // const reference = uuid;
  let supplierName = "AUTOPILOT";
  try {
    const BuyCableResponse = await axios.post(
      `${process.env.AUTOPILOT_URL}/cable`,
      payload,
      {
        headers: {
          Authorization: process.env.AUTOPILOT_API_KEY,
        },
      }
    );
    const apiResponse = BuyCableResponse.data.data.message;
    const apiResponseId =
      BuyCableResponse.data && BuyCableResponse.data.data.reference;
    // console.log({ apiResponseId, apiResponse });
    if (!BuyCableResponse.data.status)
      return {
        status: false,
        supplier: supplierName,
        msg: BuyCableResponse.data.data.message || "Transaction failed",
        apiResponseId: apiResponseId || "",
        apiResponse: apiResponse || "",
      };
    return {
      status: true,
      supplier: "AUTOPILOT",
      msg:
        BuyCableResponse.data.data.message ||
        "Cable subscription was successfully processed",
      apiResponseId: apiResponseId || "",
      apiResponse: apiResponse || "",
    };
  } catch (error) {
    let errorMsg = error.response.data.data.message || "Transaction failed";
    return {
      status: false,
      supplier: supplierName,
      msg: errorMsg || "Transaction failed",
      apiResponse: errorMsg || "",
    };
  }
};
module.exports = buyCable;
