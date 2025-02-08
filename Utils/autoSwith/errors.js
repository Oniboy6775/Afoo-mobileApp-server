const GLAD_ERRORS = [
  "you don't have sufficient data",
  "oh dear! the balance on your sme datashare",
  "you are currently owing ",
  "no response",
  "you do not have sufficient volume in bucket.",
  // "we are experiencing an internal processing error",
];
const LEGIT_ERRORS = [
  "you have reached your sme data share limit", //legit
  "insufficient account kindly fund your wallet", //legit
  // "hey there! you do not have an active datashare bundle", //legit
  "unauthorized", //legit
  "transaction on process mtn sme", //legit
  "transaction fail glo cooperate gifting",
];
const AUTOPILOT_ERROR = [
  "you may have exhaust all", //autopilot
  // "sorry, you have reached your daily", //autopilot
  "today's stock exhausted, try again tomorrow", //autopilot
];
const FASTLANE_ERROR = [
  "insufficient balance.", //fastlane
  "you have exceeded your today limit", //fastlane
  "data not found",
  // "sorry, your data balance is not sufficient for this transfer.",
  "insufficient or invalid balance",
  "data service has been disabled for you",
];
const JADATASUB_ERROR = [
  "you can't purchase this plan due to insufficient balance", //9jadatasub
  "mtn data share data not available on this network",
];
const ALARO_ERROR = [
  "something went wrong",
  "no enough value in your data bundle wallet & also insufficient amount in your ",
];
const SIM_SERVER_ERROR = [
  "transaction successful",
  "something went wrong",
  "dear customer, you do not have sufficient airtime to buy",
];
module.exports = {
  FASTLANE_ERROR,
  SIM_SERVER_ERROR,
  JADATASUB_ERROR,
  AUTOPILOT_ERROR,
  LEGIT_ERRORS,
  GLAD_ERRORS,
  ALARO_ERROR,
};
