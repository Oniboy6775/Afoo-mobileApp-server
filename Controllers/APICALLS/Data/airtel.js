const axios = require("axios");
const Supplier = require("../../../Models/supplierModel");
const { autoSwitch } = require("../../../Utils/autoSwith/autoSwitch");

const AIRTEL = async ({ mobile_number, plan, transactionId }) => {
  // CHECK FOR SUPPLIER ALARO OR GLAD
  const { supplierName } = await Supplier.findOne({ network: "AIRTEL" });
  // const supplierName = "SIM SERVER";
  const ALARO = {
    // ALARO
    301: 601,
    302: 602,
    303: 603,
    304: 604,
    305: 605,
    306: 606,
  };
  const GLAD = {
    // GLADTIDINGS
    301: 264, // 100MB
    302: 265, // 300MB

    303: 266, // 500MB
    304: 267, //1GB
    305: 268, //2GB
    306: 269, //5GB

    307: 273, //10GB
    308: 274, //15GB
    309: 275, //20GB
  };
  const DANCITY = {
    // DANCITY
    301: 265, // 100MB
    302: 266, // 300MB
    303: 232, // 500MB
    304: 231, //1GB
    305: 233, //2GB
    306: 234, //5GB
    307: 331, //10GB
    308: 336, //15GB
    309: 335, //20GB
  };
  const LEGIT = {
    301: 264, // 100MB GLAD
    302: 265, // 300MB GLAD

    303: 51, // 500MB
    304: 52, //1GB
    305: 53, //2GB
    306: 54, //5GB
    307: 55, //10GB

    308: 274, //15GB GLAD
    309: 275, //20GB GLAD
  };
  const SIM_SERVER = {
    301: "airtel_100mb_7days:portal:nil", // 100MB
    302: "airtel_300mb_7days:portal:nil", // 300MB
    303: "airtel_500mb_30days:portal:nil", // 500MB
    304: "airtel_1gb_30days:portal:nil", //1GB
    305: "airtel_2gb_30days:portal:nil", //2GB
    306: "airtel_5gb_30days:portal:nil", //5GB
    307: "airtel_10gb_30days:portal:nil", //10GB
    308: "airtel_15gb_30days:portal:nil", //15GB
    309: "airtel_20gb_30days:portal:nil", //20GB
  };
  const AUTOPILOT = {
    301: "AIRTEL_CG_1", // 100MB
    302: "AIRTEL_CG_2", // 300MB
    303: "AIRTEL_CG_3", // 500MB
    304: "AIRTEL_CG_4", //1GB
    305: "AIRTEL_CG_5", //2GB
    306: "AIRTEL_CG_6", //5GB
    307: "AIRTEL_CG_7", //10GB
    308: "AIRTEL_CG_8", //15GB
    309: "AIRTEL_CG_9", //20GB
  };
  let availablePlan =
    supplierName === "ALARO"
      ? ALARO
      : supplierName === "GLAD" || supplierName === "GLAD2"
      ? GLAD
      : supplierName === "LEGIT"
      ? LEGIT
      : supplierName === "SIM SERVER"
      ? SIM_SERVER
      : supplierName === "AUTOPILOT"
      ? AUTOPILOT
      : DANCITY;
  const isPlanExist = availablePlan.hasOwnProperty(plan);
  if (!isPlanExist)
    return {
      status: false,
      supplier: supplierName,
      msg: "plan not available at the moment",
    };
  const selectedPlan = availablePlan[plan];

  if (
    // mobile_number.startsWith("0911") ||
    // (supplierName == "LEGIT" &&
    //   (plan == "301" || plan == "302" || plan == "308" || plan == "309")) ||
    //300mb
    //100mb
    //15gb
    //20gb
    supplierName === "GLAD" ||
    supplierName == "GLAD2"
  ) {
    availablePlan = GLAD;
    const isGlad = supplierName === "GLAD";
    try {
      const BuyDataResponse = await axios.post(
        `${
          // isGlad ? process.env.GLADITINGSDATA_API : process.env.DANCITY_API
          process.env.GLADITINGSDATA_API
        }/data/`,
        {
          // network: isGlad ? "3" : "4",
          network: "3",
          mobile_number: mobile_number,
          plan: selectedPlan,
          payment_medium: "AIRTEL CG DATA BALANCE",
          Ported_number: true,
        },
        {
          headers: {
            // Authorization: isGlad
            //   ? process.env.GLADITINGSDATA_TOKEN
            //   : process.env.DANCITY_TOKEN,
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
          supplier: supplierName == "GLAD2" ? "GLAD2" : "GLAD",
          msg: BuyDataResponse.data.api_response || "Transaction failed",
          apiResponseId: apiResponseId || "",
          apiResponse: BuyDataResponse.data.api_response || "",
        };
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
      console.log(error);
      return {
        status: false,
        supplier: supplierName == "GLAD2" ? "GLAD2" : "GLAD",
        msg: "Transaction failed",
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

      if (api_response === "Transaction Successful") {
        autoSwitch({
          error: api_response,
          product: `AIRTEL-CG`,
          supplier: supplierName,
        });
      }
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
          msg: api_response || "Something went wrong",
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
  } else if (supplierName === "LEGIT") {
    try {
      const BuyDataResponse = await axios.post(
        `${process.env.LEGITDATA_API}/data`,
        {
          network: "2",
          phone: mobile_number,
          data_plan: selectedPlan,
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
      if (BuyDataResponse.data.status !== "success")
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
  } else if (supplierName == "AUTOPILOT") {
    // AUTOPILOT API CAL
    console.log("HERE");
    console.log(selectedPlan);
    let reference = `${new Date().getFullYear()}-${transactionId}`.substring(
      0,
      28
    );
    let apiResponse = "";
    try {
      const BuyDataResponse = await axios.post(
        `${process.env.AUTOPILOT_URL}/data`,
        {
          networkId: "2",
          dataType: "CORPORATE GIFTING",
          planId: selectedPlan,
          phone: mobile_number,
          reference,
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
      console.log({ apiResponseId, apiResponse });
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
      let errorMsg = error.response.data.data.message;
      if (errorMsg.startsWith("You may have exhaust all")) {
        errorMsg = "Today's stock exhausted, try again tomorrow";
      }
      return {
        status: false,
        supplier: supplierName,
        msg: errorMsg || "Transaction failed",
        apiResponse: errorMsg || "",
      };
    }
  } else {
    //ALARO
    try {
      const BuyDataResponse = await axios.get(
        `${process.env.alaroKonnect_API}/airtel_cg?apiToken=${process.env.alaroKonnect_AIRTEL_CG_TOKEN}&network=AIRTEL-CG&network_code=${selectedPlan}&mobile=${mobile_number}&ref=${transactionId}`
      );

      const apiResponse = BuyDataResponse.data.api_response || "";
      if (BuyDataResponse.data.code != 200)
        return {
          status: false,
          supplier: supplierName,
          msg: apiResponse || "Transaction failed",
          apiResponse: apiResponse || "",
        };
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
  }
};
module.exports = AIRTEL;
