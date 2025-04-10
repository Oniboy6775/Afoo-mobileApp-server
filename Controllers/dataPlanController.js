const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dataModel = require("../Models/dataModel");
const getStatusCode = require("../Utils/statusCodeMapping");

const fetchDataPlan = async (req, res) => {
  const { network, plan_type } = req.query;
  const queryInfo = {};
  if (network && network !== "all") {
    queryInfo.plan_network = network;
  }
  if (plan_type && plan_type !== "all") {
    queryInfo.plan_type = plan_type;
  }
  const plans = await dataModel.find(queryInfo).sort("volumeRatio");
  res.json(plans);
};
const addPlan = async (req, res) => {
  const requiredFields = [
    "planNetwork",
    "planName",
    "planType",
    "planValidity",
    "planId",
    "resellerPrice",
    "smartEarnerPrice",
    "apiPrice",
    "planCostPrice",
    "partnerPrice",
    "planVolumeRatio",
  ];

  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: `Missing or empty fields: ${missingFields.join(", ")}`,
    });
  }
  try {
    const {
      planNetwork,
      planName,
      planType,
      planValidity,
      planId,
      resellerPrice,
      smartEarnerPrice,
      apiPrice,
      planCostPrice,
      partnerPrice,
      planAvailability,
      planVolumeRatio,
    } = req.body;
    const networkNumber = { MTN: 1, GLO: 2, AIRTEL: 3, "9MOBILE": 4 };

    const isPlanExist = await dataModel.findOne({ id: planId });
    if (isPlanExist)
      return res.status(400).json({
        status: res.statusCode,
        status_code: getStatusCode(res.statusCode),
        msg: "This plan already exist",
      });

    await dataModel.create({
      id: planId,
      dataplan_id: planId?.toString(),
      network: networkNumber[planNetwork],
      plan_network: planNetwork,
      plan_type: planType,
      month_validate: planValidity,
      plan: planName,
      plan_amount: smartEarnerPrice,
      my_price: smartEarnerPrice,
      resellerPrice: resellerPrice,
      partnerPrice: partnerPrice,
      apiPrice: apiPrice,
      volumeRatio: planVolumeRatio,
      planCostPrice: planCostPrice,
      isAvailable: planAvailability ? true : false,
    });
    res.status(200).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: "Plan added successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: "Something went wrong",
    });
  }
};
const deletePlan = async (req, res) => {
  try {
    const planId = req.query.planId;

    if (!planId)
      return res.status(400).json({
        status: res.statusCode,
        status_code: getStatusCode(res.statusCode),
        msg: "Plan Id must be provided",
      });

    // Check if planId is a valid MongoDB ObjectId
    let query = {};

    if (mongoose.Types.ObjectId.isValid(planId)) {
      query._id = planId;
    } else {
      // If not a valid ObjectId, try to find by other fields
      query.id = planId;
    }

    const result = await dataModel.deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        status: res.statusCode,
        status_code: getStatusCode(res.statusCode),
        msg: "No plan found with the provided ID",
      });
    }

    res.status(200).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: "Plan deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: "Internal server error",
      error: error.message,
    });
  }
};
const updatePlan = async (req, res) => {
  const requiredFields = [
    "_id",
    "planNetwork",
    "planName",
    "planType",
    "planValidity",
    "planId",
    "resellerPrice",
    "smartEarnerPrice",
    "apiPrice",
    "planCostPrice",
    "partnerPrice",
    "planVolumeRatio",
  ];

  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: `Missing or empty fields: ${missingFields.join(", ")}`,
    });
  }
  try {
    const {
      _id,
      planNetwork,
      planName,
      planType,
      planValidity,
      planId,
      resellerPrice,
      smartEarnerPrice,
      apiPrice,
      planCostPrice,
      partnerPrice,
      planAvailability,
      planVolumeRatio,
    } = req.body;
    const networkNumber = { MTN: 1, GLO: 2, AIRTEL: 3, "9MOBILE": 4 };
    await dataModel.findOneAndUpdate(
      { _id },
      {
        $set: {
          id: planId,
          dataplan_id: planId,
          network: networkNumber[planNetwork],
          plan_network: planNetwork,
          plan_type: planType,
          month_validate: planValidity,
          plan: planName,
          plan_amount: smartEarnerPrice,
          my_price: smartEarnerPrice,
          resellerPrice: resellerPrice,
          partnerPrice: partnerPrice,
          apiPrice: apiPrice,
          volumeRatio: planVolumeRatio,
          planCostPrice: planCostPrice,
          isAvailable: planAvailability ? true : false,
        },
      }
    );
    res.status(200).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: "The plan has been updated ",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: "Something went wrong",
    });
  }
};

const dataPrice = async (req, res) => {
  let network = req.params.network;
  const category = req.params.category;

  console.log({ network });

  if (network == "1") network = "MTN";
  if (network == "2") network = "GLO";
  if (network == "3") network = "AIRTEL";
  if (network == "4") network = "9MOBILE";

  console.log({ network });
  if (!network)
    return res.status(400).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: "provide a valid network id",
    });
  const token = req.header("x-auth-token");
  let isAdmin = false;
  if (token) {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    isAdmin = req.user.userId === process.env.ADMIN_ID;
  }
  try {
    let queryObj = {};
    if (network) {
      queryObj.plan_network = network;
    }
    if (category && category !== "all") {
      queryObj.planCategory = category;
    }
    let dataList = dataModel.find(queryObj);
    if (!isAdmin)
      dataList.select(
        "-planCostPrice -volumeRatio -partnerPrice -planSupplier"
      );
    dataList = await dataList;
    return res.status(200).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      data: dataList,
      msg: "Data price fetched successfully",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      status: res.statusCode,
      status_code: getStatusCode(res.statusCode),
      msg: "An error occur",
    });
  }
};

module.exports = {
  fetchDataPlan,
  addPlan,
  deletePlan,
  updatePlan,
  dataPrice,
};
