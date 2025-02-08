const axios = require("axios");
const Supplier = require("../../../Models/supplierModel");

const NMobile = async (payload) => {
  const { network, mobile_number, plan, transactionId } = payload;
  // CHECK FOR SUPPLIER ALARO OR GLAD
  const { supplierName } = await Supplier.findOne({ network: "9MOBILE" });

  const LEGIT = {
    //CG
    401: 86, //1GB
    // 402: 93, //1.5GB
    403: 87, //2GB
    404: 88, //3GB
    405: 90, //5GB
    // 406: 305, //10GB
  };
  const GLAD = {
    //SME
    401: 298, //1GB
    402: 300, //1.5GB
    403: 299, //2GB
    404: 303, //3GB
    405: 304, //5GB
    406: 305, //10GB
  };
  const availablePlan =
    supplierName === "GLAD" || supplierName === "GLAD2" ? GLAD : LEGIT;
  const isPlanExist = availablePlan.hasOwnProperty(plan);
  if (!isPlanExist)
    return { status: false, supplier: supplierName, msg: "Invalid plan Id" };
  const selectedPlan = availablePlan[plan];
  if (supplierName === "LEGIT") {
    try {
      const BuyDataResponse = await axios.post(
        `${process.env.LEGITDATA_API}/data`,
        {
          network: "4",
          phone: mobile_number,
          data_plan: selectedPlan,
          bypass: true,
          "request-id": transactionId,
        },
        {
          headers: {
            Authorization: process.env.LEGITDATA_TOKEN,
          },
        }
      );
      const apiResponseId =
        BuyDataResponse.data && BuyDataResponse.data["request-id"];
      if (BuyDataResponse.data.status === "fail")
        return {
          status: false,
          supplier: supplierName,
          msg: BuyDataResponse.data.message || "Transaction failed",
          apiResponseId: apiResponseId || "",
          apiResponse: BuyDataResponse.data.response || "",
        };
      return {
        status: true,
        supplier: supplierName,
        msg:
          BuyDataResponse.data.response ||
          `Data purchase for ${mobile_number} was successful`,
        apiResponseId: apiResponseId || "",
        apiResponse: BuyDataResponse.data.response || "",
      };
    } catch (error) {
      const errorMsg = error.response.data
        ? error.response.data.response || error.response.data.message
        : "Transaction failed";
      return {
        status: false,
        supplier: supplierName,
        msg: errorMsg,
      };
    }
  } else
    try {
      const BuyDataResponse = await axios.post(
        `${process.env.GLADITINGSDATA_API}/data/`,
        {
          network: network,
          mobile_number: mobile_number,
          plan: selectedPlan,
          Ported_number: true,
        },
        {
          headers: {
            Authorization:
              supplierName == "GLAD2"
                ? process.env.GLADITINGSDATA_TOKEN_2
                : process.env.GLADITINGSDATA_TOKEN,
          },
        }
      );
      const apiResponseId = BuyDataResponse.data && BuyDataResponse.data.ident;
      if (BuyDataResponse.data.Status === "failed")
        return {
          status: false,
          supplier: supplierName,
          msg: BuyDataResponse.data.api_response || "Transaction failed",
          apiResponseId: apiResponseId || "",
          apiResponse: BuyDataResponse.data.api_response || "",
        };
      return {
        status: true,
        supplier: supplierName,
        msg:
          BuyDataResponse.data.api_response ||
          `Data purchase for ${mobile_number} was successful`,
        apiResponseId: apiResponseId || "",
        apiResponse: BuyDataResponse.data.api_response || "",
      };
    } catch (error) {
      console.log(error);
      return {
        status: false,
        supplier: supplierName,
        msg: "Transaction failed",
      };
    }
};
module.exports = NMobile;
