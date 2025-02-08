const supplierModel = require("../../Models/supplierModel");
const { sendPushNotification } = require("../expo/notification");
const {
  AUTOPILOT_ERROR,
  FASTLANE_ERROR,
  JADATASUB_ERROR,
  GLAD_ERRORS,
  LEGIT_ERRORS,
  SIM_SERVER_ERROR,
  ALARO_ERROR,
} = require("./errors");

const autoSwitch = async ({ product, error, supplier }) => {
  let suppliedError = error.toLowerCase();
  suppliedError = suppliedError.split(" ").slice(0, 5).join(" ");

  const availableProduct = {
    "MTN-SME": {
      errors: [
        ...JADATASUB_ERROR,
        ...FASTLANE_ERROR,
        ...LEGIT_ERRORS,
        ...GLAD_ERRORS,
        ...AUTOPILOT_ERROR,
        ...ALARO_ERROR,
      ],
      suppliers: [
        "SIM_AUTO",
        "AUTOPILOT",
        "ALARO",
        "9JADATASUB",
        "UASUBPOINT",
        "DATALANE",
        "SIM_AUTO_SME",
        "LEGIT",
        "GLAD",
      ],
    },
    "MTN-CG": {
      errors: [
        ...AUTOPILOT_ERROR,
        "hash something went wrong please check back",
        ...FASTLANE_ERROR,
        ...JADATASUB_ERROR,
        ...ALARO_ERROR,
      ],
      suppliers: [
        "SIM_AUTO",
        "AUTOPILOT",
        "ALARO",
        "9JADATASUB",
        "UASUBPOINT",
        "DATALANE",
        "GLAD",
      ],
    },
    "MTN-DATA_TRANSFER": {
      errors: [
        ...AUTOPILOT_ERROR,
        "hash something went wrong please check back",
        ...FASTLANE_ERROR,
        ...JADATASUB_ERROR,
        ...ALARO_ERROR,
      ],
      suppliers: [
        "SIM_AUTO",
        "AUTOPILOT",
        "ALARO",
        "9JADATASUB",
        "UASUBPOINT",
        "DATALANE",
      ],
    },

    "MTN-SME2": {
      errors: [
        ...AUTOPILOT_ERROR,
        ...GLAD_ERRORS,
        ...FASTLANE_ERROR,
        ...JADATASUB_ERROR,
        ...ALARO_ERROR,
      ],
      suppliers: [
        "SIM_AUTO",
        "AUTOPILOT",
        "ALARO",
        "9JADATASUB",
        "UASUBPOINT",
        "DATALANE",
        "GLAD",
      ],
    },
    "AIRTEL-CG": {
      errors: [...SIM_SERVER_ERROR, ...LEGIT_ERRORS, ...GLAD_ERRORS],
      suppliers: ["SIM SERVER", "LEGIT", "GLAD"],
    },
    "GLO-CG": {
      errors: [...LEGIT_ERRORS, ...GLAD_ERRORS, ...ALARO_ERROR],
      suppliers: ["LEGIT", "GLAD", "ALARO"],
    },
  };
  // check if product is available
  if (!availableProduct[product]) {
    console.log("product not available");
    return;
  }
  let productInfo = availableProduct[product];
  // console.log(productInfo);
  // check the errors
  let availableErrors = productInfo.errors;
  let errorIsAvailable = availableErrors.find((e) =>
    e.startsWith(suppliedError)
  );
  // console.log(errorIsAvailable);
  if (!errorIsAvailable) {
    console.log("This error was not handled");
    return;
  }

  // check old and new supplier
  let availableSuppliers = productInfo.suppliers;
  let oldSupplierIndex = availableSuppliers.indexOf(supplier);
  if (oldSupplierIndex < 0) {
    console.log("old supplier not available");
    return;
  }
  let maxNoOfSuppliers = availableSuppliers.length - 1;

  let newSupplierIndex = oldSupplierIndex + 1;

  if (newSupplierIndex > maxNoOfSuppliers) {
    newSupplierIndex = 0;
  }

  let newSupplier = availableSuppliers[newSupplierIndex];

  if (!newSupplier) {
    console.log("No new supplier");
    return;
  }
  let productToUpdate = product;
  if (product == "MTN-SME") {
    productToUpdate = "MTN";
  }
  if (product == "GLO-CG") {
    productToUpdate = "GLO";
  }
  if (product == "AIRTEL-CG") {
    productToUpdate = "AIRTEL";
  }
  const result = await supplierModel.updateOne(
    { network: productToUpdate },
    { $set: { supplierName: newSupplier } }
  );

  if (result.modifiedCount > 0) {
    sendPushNotification({
      title: `${product} ${supplier}-${newSupplier} SUCCESS`,
      body: error,
      pushTokens: [
        "ExponentPushToken[0TMSfQC_FSh9VlkmAfJrpw]",
        "ExponentPushToken[aaBqopItZ1hiMm_8Pw-0xn]",
      ],
    });
  } else {
    sendPushNotification({
      title: `${product} ${supplier}-${newSupplier} FAILED`,
      body: error,
      pushTokens: [
        "ExponentPushToken[0TMSfQC_FSh9VlkmAfJrpw]",
        "ExponentPushToken[aaBqopItZ1hiMm_8Pw-0xn]",
      ],
    });
  }
};
module.exports = { autoSwitch };
