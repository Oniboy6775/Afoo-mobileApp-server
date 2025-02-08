const { default: axios } = require("axios");

const validateCable = async ({ smartCardNo, cableName }) => {
  const payload = {
    cableType: cableName,
    smartCardNo: smartCardNo,
  };
  try {
    const ValidateCableResponse = await axios.post(
      `${process.env.AUTOPILOT_URL}/validate/smartcard-no`,
      payload,
      {
        headers: {
          Authorization: process.env.AUTOPILOT_API_KEY,
        },
      }
    );
    const { customerName, smartCardNo } =
      ValidateCableResponse.data.data.validate;
    if (!ValidateCableResponse.data.status)
      return {
        status: false,
        msg: ValidateCableResponse.data.data.message || "Transaction failed",
      };
    return {
      status: true,
      msg:
        ValidateCableResponse.data.data.message ||
        "Cable subscription was successfully processed",
      customerName,
      smartCardNo,
    };
  } catch (error) {
    let errorMsg = error.response.data.data.message || "Transaction failed";
    return {
      status: false,
      msg: errorMsg || "Validation failed",
    };
  }
};
module.exports = validateCable;
