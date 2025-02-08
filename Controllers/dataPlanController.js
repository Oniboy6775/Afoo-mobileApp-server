const dataModel = require("../Models/dataModel");

const fetchDataPlan = async (req, res) => {
  const { network, dataType } = req.query;
  const queryInfo = {};
  if (network && network !== "all") {
    queryInfo.plan_network = network;
  }
  if (dataType && dataType !== "all") {
    queryInfo.plan_type = dataType;
  }
  const plans = await dataModel.find(queryInfo).sort("volumeRatio");
  res.json(plans);
};
module.exports = {
  fetchDataPlan,
};
