const { default: axios } = require("axios");
const transactionModel = require("../Models/transactionModel");

const sendWebhookPayload = async ({ url, transactionId }) => {
  let payload = {};
  payload = await transactionModel
    .findOne({ trans_Id: transactionId })
    .select("-trans_supplier -trans_profit -_id -trans_By -trans_volume_ratio");
  console.log(payload);
  axios.post(url, payload).then(
    (result) => {
      //   console.log(result);
    },
    (error) => {
      //   console.error(error);
    }
  );
};
module.exports = sendWebhookPayload;
