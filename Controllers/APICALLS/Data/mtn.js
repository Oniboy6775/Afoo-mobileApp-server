const axios = require("axios");
const Supplier = require("../../../Models/supplierModel");
const { checkAdminBalance } = require("../../../Utils/checkAdminBalance");
const sendEmail = require("../../../Utils/sendMail");

const MTN = async ({
  mobile_number,
  plan,
  plan_type,
  transactionId,
  userName,
}) => {
  // CHECK FOR SUPPLIER ALARO OR GLAD
  const { supplierName: supplier } = await Supplier.findOne({
    network: plan_type == "SME" ? "MTN" : `MTN-${plan_type}`,
  });
  // let supplierName = "ALARO";
  let supplierName = supplier;
  const specialPlan = [
    115, 116, 117, 118, 121, 123, 125, 127, 128, 129, 130, 131, 132,
  ];
  let mustBeGLAD =
    supplierName.startsWith("GLAD") || specialPlan.includes(plan);

  const ALARO = {
    101: "500MB_MTN-SME",
    102: "1GB_MTN-SME",
    103: "2GB_MTN-SME",
    104: "3GB_MTN-SME",
    105: "5GB_MTN-SME",
    106: "10GB_MTN-SME",

    // alaro SME2 === SME
    119: "500MB_MTN-CG", //500mb
    120: "1GB_MTN-CG", //1gb
    122: "2GB_MTN-CG", //2gb
    124: "3GB_MTN-CG", //3gb
    126: "5GB_MTN-CG", //5gb
    129: "10GB_MTN-CG", //10gb

    // Alaro Konnet CG
    106: "500MB_MTN",
    107: "1GB_MTN-CG",
    108: "2GB_MTN-CG",
    109: "3GB_MTN-CG",
    110: "5GB_MTN-CG",
    111: "10GB_MTN-CG",
    //
    // // data transfer (MTN DIRECT)
    // 140: 500,
    // 141: 1000,
    // 142: 2000,
    // 143: 3000,
    // 144: 5000,
  };
  const GLAD = {
    // Glad SME
    // 101: 179, //500MB
    // 102: 166, //1GB
    // 103: 167, //2GB
    // 104: 168, //3GB
    // 105: 169, //5GB

    // Glad SME as SME2
    101: 358, //500MB
    102: 353, //1GB
    103: 354, //2GB
    104: 355, //3GB
    105: 356, //5GB

    // Gladtidings CG
    // 106: 225,
    // 107: 213,
    // 108: 215,
    // 109: 216,
    // 110: 217,
    // 111: 257,

    //  Glad CG as SME2
    106: 358, //500mb
    107: 353, //1gb
    108: 354, //2gb
    109: 355, //3gb
    110: 356, //5gb
    111: 357, //10gb
    // Glad Coupon
    112: 383, //750mb
    113: 385, //1gb
    114: 390, //3gb
    //Glad sme2
    115: 363, //20mb
    116: 364, //25mb
    117: 368, //50mb
    118: 360, //100mb
    119: 358, //500mb
    120: 353, //1gb
    121: 359, //1.5gb
    122: 354, //2gb
    123: 420, //2.5gb
    124: 355, //3gb
    125: 340, //4gb
    126: 356, //5gb
    127: 366, //6gb
    128: 367, //7gb
    129: 357, //10gb
    130: 418, //36gb
    131: 416, //40gb
    132: 417, //50gb

    // MTN-AWOOF
    145: 453, //1GB Daily Plan
    146: 454, //3.5GB 2-Days Plan
    147: 455, //15GB 7-Days Plan
  };
  const LEGIT = {
    // SME
    101: 36,
    102: 37,
    103: 38,
    104: 39,
    105: 40,

    //  CG
    106: 42,
    107: 46,
    108: 47,
    109: 48,
    110: 49, //5gb
    111: 50, //10gb
  };
  const SIM_SERVER = {
    101: "data_share_500mb:device:USSD_SHARE_FULL",
    102: "data_share_1gb:device:USSD_SHARE_FULL", //1GB
    103: "data_share_2gb:device:USSD_SHARE_FULL", //2GB
    104: "data_share_3gb:device:USSD_SHARE_FULL", //3GB
    105: "data_share_5gb:device:USSD_SHARE_FULL", //5GB
  };
  const AUTOPILOT = {
    //SME
    101: "MTN_SME_500MB_30DAYS",
    102: "MTN_SME_1GB_30DAYS", //1GB
    103: "MTN_SME_2GB_30DAYS", //2GB
    104: "MTN_SME_3GB_30DAYS", //3GB
    105: "MTN_SME_5GB_30DAYS", //5GB
    //SME AS MTN DIRECT
    // 101: "MTN_DT_500MB",
    // 102: "MTN_DT_1GB",
    // 103: "MTN_DT_2GB",
    // 104: "MTN_DT_3GB",
    // 105: "MTN_DT_5GB",
    //CG AS MTN DIRECT
    106: "MTN_DT_500MB",
    107: "MTN_DT_1GB",
    108: "MTN_DT_2GB",
    109: "MTN_DT_3GB",
    110: "MTN_DT_5GB",
    //SME2 AS MTN DIRECT
    119: "MTN_DT_500MB",
    120: "MTN_DT_1GB",
    122: "MTN_DT_2GB",
    124: "MTN_DT_3GB",
    126: "MTN_DT_5GB",
    // data transfer (MTN DIRECT)
    140: "MTN_DT_500MB",
    141: "MTN_DT_1GB",
    142: "MTN_DT_2GB",
    143: "MTN_DT_3GB",
    144: "MTN_DT_5GB",

    // MTN-AWOOF
    145: "MTN_AWOOF_1", //1GB Daily Plan
    146: "MTN_AWOOF_2", //3.5GB 2-Days Plan
    147: "MTN_AWOOF_3", //15GB 7-Days Plan
  };

  const SIM_AUTO = {
    // SME as DATA SHARE
    101: "MTN_DATA_SHARE_4",
    102: "MTN_DATA_SHARE_5",
    103: "MTN_DATA_SHARE_6",
    104: "MTN_DATA_SHARE_7",
    105: "MTN_DATA_SHARE_8",

    //CG
    // 106: "MTN_DATA_SHARE_4",
    107: "MTN_DATA_SHARE_5",
    108: "MTN_DATA_SHARE_6",
    109: "MTN_DATA_SHARE_7",
    110: "MTN_DATA_SHARE_8",
    //sme2
    // 119: "MTN_DATA_SHARE_4",
    120: "MTN_DATA_SHARE_5",
    122: "MTN_DATA_SHARE_6",
    124: "MTN_DATA_SHARE_7",
    126: "MTN_DATA_SHARE_8",
    //dat transfer
    // 140: "MTN_DATA_SHARE_4",
    141: "MTN_DATA_SHARE_5",
    142: "MTN_DATA_SHARE_6",
    143: "MTN_DATA_SHARE_7",
    144: "MTN_DATA_SHARE_8",

    // MTN-AWOOF
    145: "MTN_AWOOF_1", //1GB Daily Plan
    146: "MTN_AWOOF_2", //3.5GB 2-Days Plan
    147: "MTN_AWOOF_3", //15GB 7-Days Plan
  };
  const SIM_AUTO_SME = {
    //sme
    101: "MTN_SME_1",
    102: "MTN_SME_2",
    103: "MTN_SME_3",
    104: "MTN_SME_4",
    105: "MTN_SME_5",
    151: "MTN_SME_6",
    //CG
    106: "MTN_SME_1",
    107: "MTN_SME_2",
    108: "MTN_SME_3",
    109: "MTN_SME_4",
    110: "MTN_SME_5",
    //sme2
    119: "MTN_SME_1",
    120: "MTN_SME_2",
    122: "MTN_SME_3",
    124: "MTN_SME_4",
    126: "MTN_SME_5",
    129: "MTN_SME_6", //10gb
  };
  let availablePlan =
    supplierName === "ALARO"
      ? ALARO
      : mustBeGLAD
      ? GLAD
      : supplierName === "LEGIT"
      ? LEGIT
      : supplierName === "SIM SERVER"
      ? SIM_SERVER
      : supplierName === "AUTOPILOT"
      ? AUTOPILOT
      : supplierName === "SIM_AUTO"
      ? SIM_AUTO
      : SIM_AUTO_SME;

  let selectedPlan = availablePlan[plan];

  const isPlanExist = availablePlan.hasOwnProperty(plan);
  if (!isPlanExist)
    return {
      status: false,
      supplier: supplierName,
      msg: "This plan is not available at the moment, try other plans",
    };

  // If the data is 500MB or the supplier is  GLAD
  if (supplierName === "GLAD" || supplierName == "GLAD2" || mustBeGLAD) {
    try {
      const BuyDataResponse = await axios.post(
        `${process.env.GLADITINGSDATA_API}/data/`,
        {
          network: "1",
          mobile_number: mobile_number,
          plan: plan == "101" ? "179" : selectedPlan,
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
      const adminNewBalance = BuyDataResponse.data?.balance_after;
      checkAdminBalance({ adminNewBalance, supplierName });
      if (BuyDataResponse.data.Status === "failed") {
        return {
          status: false,
          supplier: supplierName == "GLAD2" ? "GLAD2" : "GLAD",
          msg: BuyDataResponse.data.api_response || "Transaction failed",
          apiResponseId: apiResponseId || "",
          apiResponse: BuyDataResponse.data.api_response || "",
        };
      }
      return {
        status: true,
        supplier: supplierName == "GLAD2" ? "GLAD2" : "GLAD",
        msg:
          BuyDataResponse.data.api_response ||
          `Data purchase for ${mobile_number} was successful`,
        apiResponseId: apiResponseId || "",
        apiResponse: BuyDataResponse.data.api_response || "",
      };
    } catch (error) {
      return {
        status: false,
        supplier: supplierName == "GLAD2" ? "GLAD2" : "GLAD",
        msg: "Transaction failed",
      };
    }
  } else if (supplierName === "ALARO") {
    let isCG = plan_type == "CG" || plan_type == "SME2";
    try {
      // const BuyDataResponse = await axios.get(
      //   `${process.env.alaroKonnect_API}/${isCG ? "gifting" : "mtn"}?apiToken=${
      //     process.env.alaroKonnect_MTN_TOKEN
      //   }&network=${
      //     isCG ? "GIFTING" : "MTN"
      //   }&network_code=${selectedPlan}&mobile=${mobile_number}&ref=${transactionId}`
      // );
      const BuyDataResponse = await axios.post(
        `${process.env.alaroKonnect_API}/api/data/`,
        {
          net_id: "MTN",
          mobile_number: mobile_number,
          plan: selectedPlan,
        },
        {
          headers: {
            Authorization: "Token" + " " + process.env.alaroKonnect_MTN_TOKEN,
          },
        }
      );
      const apiResponse = BuyDataResponse.data.api_response || "";
      if (
        apiResponse.startsWith("Dear Customer, your balance is insufficient")
      ) {
        return {
          status: false,
          supplier: supplierName,
          msg: "Something Went Wrong",
          apiResponse: "Something Went Wrong",
        };
      }
      if (BuyDataResponse.data.Status == "failed") {
        return {
          status: false,
          supplier: supplierName,
          msg: apiResponse || "Transaction failed",
          apiResponse: apiResponse || "",
        };
      }
      return {
        status: true,
        supplier: supplierName,
        msg: apiResponse || `Data purchase for ${mobile_number} was successful`,
        apiResponse: apiResponse || "",
      };
    } catch (error) {
      return {
        status: false,
        supplier: supplierName,
        msg: "Transaction failed",
      };
    }
  } else if (supplierName === "LEGIT") {
    try {
      const BuyDataResponse = await axios.post(
        `${process.env.LEGITDATA_API}/data`,
        {
          network: "1",
          phone: mobile_number,
          data_plan: plan == "101" ? 36 : selectedPlan,
          bypass: mobile_number.startsWith("0707") ? true : false,
          "request-id": transactionId,
        },
        {
          headers: {
            Authorization: process.env.LEGITDATA_TOKEN,
          },
        }
      );
      // console.log(BuyDataResponse.data);
      const adminNewBalance = BuyDataResponse.data?.newbal;
      checkAdminBalance({ adminNewBalance, supplierName });
      const apiResponseId =
        BuyDataResponse.data && BuyDataResponse.data["request-id"];
      if (BuyDataResponse.data.status !== "success") {
        return {
          status: false,
          supplier: "LEGIT",
          msg:
            BuyDataResponse.data.response ||
            BuyDataResponse.data.message ||
            "Transaction failed",
          apiResponseId: apiResponseId || "",
          apiResponse: BuyDataResponse.data.response || "",
        };
      }

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
      // console.log(error);
      const errorMsg = error.response.data
        ? error.response.data.response || error.response.data.message
        : "Transaction failed";

      return {
        status: false,
        supplier: "LEGIT",
        msg: errorMsg,
      };
    }
  } else if (supplierName == "SIM SERVER") {
    try {
      const buyDataResponse = await axios.post(process.env.SIM_SERVER_URL, {
        process: "buy",
        api_key: process.env.SIM_SERVER_API_KEY,
        product_code: selectedPlan,
        recipient: mobile_number,
        callback: process.env.CALLBACK_URL,
        user_reference: transactionId,
      });
      // console.log(buyDataResponse.data);
      let success = buyDataResponse.data.status == true;
      let api_response = buyDataResponse.data.data.true_response;
      let apiResponseId = buyDataResponse.data.data.user_reference;
      // console.log({ success, api_response, apiResponseId });
      if (success) {
        return {
          status: true,
          supplier: supplierName,
          msg:
            api_response || `Data purchase for ${mobile_number} was successful`,
          apiResponseId: apiResponseId || "",
          apiResponse: api_response || "",
        };
      } else {
        return {
          status: false,
          supplier: supplierName,
          msg: api_response || "Transaction failed",
          apiResponseId: apiResponseId || "",
          apiResponse: api_response || "",
        };
      }
    } catch (error) {
      console.log(error);
      return {
        status: false,
        supplier: supplierName,
        msg: "Transaction failed",
      };
    }
  } else if (supplierName == "AUTOPILOT") {
    // AUTOPILOT API CAL
    // let reference = `${new Date().getFullYear()}-${transactionId}`.substring(
    //   0,
    //   28
    // );
    let apiResponse = "";
    try {
      const BuyDataResponse = await axios.post(
        `${process.env.AUTOPILOT_URL}/data`,
        {
          networkId: "1",
          // dataType: plan_type == "DIRECT" ? "DATA TRANSFER" : "SME",
          dataType: plan_type == "AWOOF" ? "AWOOF GIFTING" : "DATA TRANSFER",
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
  } else if (supplierName.startsWith("SIM_AUTO")) {
    try {
      const BuyDataResponse = await axios.post(
        `${process.env.SIM_AUTO_API}/shareData`,
        {
          network: "MTN",
          phoneNumber: mobile_number,
          planId: selectedPlan,
          planType:
            supplierName == "SIM_AUTO_SME"
              ? "SME"
              : plan_type == "AWOOF"
              ? "AWOOF"
              : "DATA_SHARE",
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.SIM_AUTO_API_KEY}`,
            "x-auth-apikey": `Bearer ${process.env.SIM_AUTO_API_KEY}`,
          },
        }
      );
      // console.log(BuyDataResponse.data);
      return {
        status: true,
        supplier: supplierName,
        msg: BuyDataResponse?.data?.msg || "Failed",
      };
    } catch (e) {
      let errMsg = e.response?.data?.msg || "";
      if (
        errMsg &&
        errMsg.startsWith(
          "Hey There! You do not have an active Datashare bundle"
        )
      ) {
        errMsg = `${mobile_number} is likely not a MTN number`;
      }
      return {
        status: false,
        supplier: supplierName,
        msg: errMsg || "failed",
      };
    }
  } else {
    return {
      status: false,
      supplier: "no supplier",
      msg: "Transaction failed",
    };
  }
};
module.exports = MTN;
