const axios = require("axios");
const Supplier = require("../../../Models/supplierModel");

const glo9mobile = async (payload) => {
  const { network, mobile_number, plan, transactionId, userName } = payload;
  const { supplierName } = await Supplier.findOne({ network: "GLO" });
  // const supplierName = "ALARO";
  const GLAD = {
    201: "331",
    202: "334",
    203: "332",
    204: "336",
    205: "329",
    206: "335",
    // 207: "18",
    // 208: "65",
    // 209: "218",
    // 210: "219",
    // 211: "220",
  };
  const DANCITY = {
    201: "346", //500mb
    202: "348", //1gb
    203: "349", //2gb
    204: "350", //3gb
    205: "351", //5gb
    206: "352", //10gb
    // 207: "18",
    // 208: "65",
    // 209: "218",
    // 210: "219",
    // 211: "220",
  };
  const LEGIT = {
    201: 71, //500mb
    202: 72, //1gb
    203: 73, //2gb
    204: 74, //3gb
    205: 75, //5gb
    206: 76, //10gb
  };
  const ALARO = {
    201: "500mb_30_days", //500mb
    202: "1gb_30_days	", //1gb
    203: "2gb_30_days", //2gb
    204: "3gb_30_days", //3gb
    205: "5gb_30_days", //5gb
    206: "10gb_30_days", //10gb
  };
  const AUTOPILOT = {
    201: "GLO_CG_2", //500mb
    202: "GLO_CG_3", //1gb
    203: "GLO_CG_4", //2gb
    204: "GLO_CG_5", //3gb
    205: "GLO_CG_6", //5gb
    206: "GLO_CG_7", //10gb not available on Autopilot
  };
  const SUB_ARENA = {
    201: "228", //500mb
    202: "229", //1gb
    203: "230", //2gb
    204: "231", //3gb
    205: "232", //5gb
    206: "233", //10gb
  };
  const availablePlan =
    supplierName === "GLAD" || supplierName === "GLAD2"
      ? GLAD
      : supplierName === "LEGIT"
      ? LEGIT
      : supplierName === "ALARO"
      ? ALARO
      : supplierName === "AUTOPILOT"
      ? AUTOPILOT
      : supplierName === "SUB_ARENA"
      ? SUB_ARENA
      : DANCITY;
  const isPlanExist = availablePlan.hasOwnProperty(plan);
  if (!isPlanExist)
    return { status: false, supplier: supplierName, msg: "Invalid plan Id" };
  const selectedPlan = availablePlan[plan];
  // || plan == 201 || plan == 206
  if (supplierName === "LEGIT") {
    try {
      const BuyDataResponse = await axios.post(
        `${process.env.LEGITDATA_API}/data`,
        {
          network: "3",
          phone: mobile_number,
          data_plan: plan == 201 ? "71" : plan == 206 ? "76" : selectedPlan,
          bypass: false,
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
          supplier: "LEGIT",
          msg: BuyDataResponse.data.message || "Transaction failed",
          apiResponseId: apiResponseId || "",
          apiResponse: BuyDataResponse.data.response || "",
        };
      return {
        status: true,
        supplier: "LEGIT",
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
        supplier: "LEGIT",
        msg: errorMsg,
      };
    }
  } else if (supplierName === "ALARO") {
    try {
      const BuyDataResponse = await axios.post(
        process.env.ALARO_PRO_API,
        {
          network_type: "glo_c",
          plan_id: selectedPlan,
          phone_number: mobile_number,
          transaction_id: transactionId,
        },
        {
          headers: {
            Authorization: process.env.ALARO_PRO_API_KEY,
          },
        }
      );
      // console.log(BuyDataResponse);
      const apiResponse = BuyDataResponse.data.api_response || "";
      const apiMessage = BuyDataResponse.data.message || "";
      const apiStatus = BuyDataResponse.data.status;
      if (apiStatus == "failed" || apiStatus == false)
        return {
          status: false,
          supplier: supplierName,
          msg: apiResponse || apiMessage || "Transaction failed",
          apiResponse: apiResponse || "",
        };

      return {
        status: true,
        supplier: supplierName,
        msg: apiResponse || `Data purchase for ${mobile_number} was successful`,
        apiResponse: apiResponse || "",
      };
    } catch (error) {
      let errMsg = error.response.data.message || "";
      return {
        status: false,
        supplier: supplierName,
        msg: errMsg || "Transaction failed",
      };
    }
  } else if (supplierName == "AUTOPILOT") {
    let apiResponse = "";
    try {
      const BuyDataResponse = await axios.post(
        `${process.env.AUTOPILOT_URL}/data`,
        {
          networkId: "3",
          dataType: "CORPORATE GIFTING",
          planId: selectedPlan,
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
      apiResponse = BuyDataResponse.data.data.message;
      const apiResponseId =
        BuyDataResponse.data && BuyDataResponse.data.data.reference;
      // console.log({ apiResponseId, apiResponse });
      if (!BuyDataResponse.data.status)
        return {
          status: false,
          supplier: supplierName,
          msg: BuyDataResponse.data.data.message || "Transaction failed",
          apiResponseId: apiResponseId || "",
          apiResponse: BuyDataResponse.data.data.message || "",
        };
      if (
        //   BuyDataResponse.data.data.message.startsWith(
        //   "Data Share Status Cannot be  Confirmed At The"
        // ) ||
        BuyDataResponse.data.data.message.startsWith("SUCCESSFUL")
        // &&
        // userName == "yangaplug"
      )
        return {
          status: false,
          supplier: supplierName,
          msg: BuyDataResponse.data.data.message || "Transaction failed",
          apiResponseId: apiResponseId || "",
          apiResponse: BuyDataResponse.data.data.message || "",
        };
      return {
        status: true,
        supplier: supplierName,
        msg:
          BuyDataResponse.data.data.message ||
          `Data purchase for ${mobile_number} was successful`,
        apiResponseId: apiResponseId || "",
        apiResponse: BuyDataResponse.data.data.message || "",
      };
    } catch (error) {
      let errorMsg = error.response.data.data.message || "Transaction failed";

      if (errorMsg.startsWith("You may have exhaust all")) {
        errorMsg = "Today's stock exhausted, try again tomorrow";
        // errorMsg = "Transaction Failed";
      }
      return {
        status: false,
        supplier: supplierName,
        msg: errorMsg || "Transaction failed",
        apiResponse: errorMsg || "",
      };
    }
  } else
    try {
      const isGlad = supplierName.startsWith("GLAD") ? true : false;
      const BuyDataResponse = await axios.post(
        `${
          isGlad ? process.env.GLADITINGSDATA_API : process.env.SUB_ARENA_API
        }/data/`,
        {
          network: "2",
          mobile_number: mobile_number,
          plan: selectedPlan,
          Ported_number: true,
        },
        {
          headers: {
            Authorization:
              supplierName === "GLAD2"
                ? process.env.GLADITINGSDATA_TOKEN_2
                : isGlad
                ? process.env.GLADITINGSDATA_TOKEN
                : process.env.SUB_ARENA_TOKEN,
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
module.exports = glo9mobile;
