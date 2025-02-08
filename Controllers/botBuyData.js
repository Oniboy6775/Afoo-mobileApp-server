const axios = require("axios");

const BUYDATA = async ({
  network,
  networkId,
  mobile_number,
  volume,
  token,
}) => {
  let plan = "";
  // console.log({
  //   network,
  //   networkId,
  //   mobile_number,
  //   volume,
  //   token,
  // });
  // return { status: true, msg: "Data processed successful" };
  const PLANS = {
    MTN: {
      0.5: 101, //500MB
      1: 102, //1GB
      2: 103, //2GB
      3: 104, //3GB
      5: 105, //5GB
    },
    GLO: {
      0.5: 201, //500MB
      1: 202, //1GB
      2: 203, //2GB
      3: 204, //3GB
      5: 205, //5GB
      5: 206, //10GB
    },
    AIRTEL: {
      0.5: 303, //500MB
      1: 304, //1GB
      2: 305, //2GB
      5: 306, //10GB
      //   3: 204, //3GB
      //   5: 205, //5GB
    },
    ["9MOBILE"]: {
      //   0.5: 201, //500MB
      1: 401, //1GB
      2: 402, //2GB
      3: 403, //3GB
      5: 404, //5GB
      5: 405, //10GB
    },
  };
  const availablePlan = PLANS[network.toUpperCase()];
  const isPlanExist = availablePlan.hasOwnProperty(volume);
  if (!isPlanExist) return { status: false, msg: "Invalid plan Id" };
  //   return { status: true, msg: "Invalid plan Id" };
  // console.log({ selected: availablePlan[volume] });
  try {
    const BuyDataResponse = await axios.post(
      `${process.env.DATARELOADED_API}/buy/data`,
      {
        network: networkId,
        mobile_number: mobile_number,
        plan: availablePlan[volume],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return {
      status: true,
      msg: BuyDataResponse.data.msg || "Data Purchase successful",
      data: BuyDataResponse.data.receipt,
    };
  } catch (error) {
    console.log(error.response.data);
    return {
      status: false,
      msg: error.response.data.msg || "Transaction failed",
    };
  }
};
module.exports = BUYDATA;
