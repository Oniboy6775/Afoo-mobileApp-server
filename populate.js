const mongoose = require("mongoose");
const cabletvModel = require("./Models/cabletvModel");
const dataModel = require("./Models/dataModel");
const services = require("./Models/services");
const costPriceModel = require("./Models/costPriceModel");
const User = require("./Models/usersModel");
const Notification = require("./Models/notification");

const { GOTV, DSTV, STARTIME } = require("./API_DATA/cabletv");
const {
  MTN_SME,
  GLO,
  AIRTEL,
  NMOBILE,
  MTN_SME2,
  MTN_CG,
} = require("./API_DATA/newData");
require("dotenv").config();
const costPrices = [
  { network: "MTN", costPrice: 300 },
  { network: "MTN-CG", costPrice: 300 },
  { network: "MTN-SME2", costPrice: 300 },
  { network: "GLO", costPrice: 300 },
  { network: "AIRTEL", costPrice: 300 },
  { network: "9MOBILE", costPrice: 300 },
  // { network: "MTN-COUPON", costPrice: 300 },
  // { network: "MTN-DIRECT", costPrice: 300 },
  // { network: "MTN-COUPON", costPrice: 300 },
];
const populate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("DB connected");
    await dataModel.deleteMany();
    await costPriceModel.deleteMany();
    await dataModel.create(MTN_SME);
    // await dataModel.create(MTN_SME2);
    // await dataModel.create(MTN_CG);
    await dataModel.create(AIRTEL);
    await dataModel.create(GLO);
    await dataModel.create(NMOBILE);
    await costPriceModel.create(costPrices);
    // await dataModel.create(MTN_COUPON);
    // await dataModel.create(MTN_DIRECT);
    await dataModel.updateMany(
      { plan: "500MB" },
      { $set: { volumeRatio: 0.5 } }
    );
    await dataModel.updateMany(
      { plan: "500.0MB" },
      { $set: { volumeRatio: 0.5 } }
    );
    await dataModel.updateMany(
      { plan: "750MB" },
      { $set: { volumeRatio: 0.75 } }
    );
    await dataModel.updateMany({ plan: "1GB" }, { $set: { volumeRatio: 1 } });
    await dataModel.updateMany(
      { plan: "1.5GB" },
      { $set: { volumeRatio: 1.5 } }
    );
    await dataModel.updateMany({ plan: "2GB" }, { $set: { volumeRatio: 2 } });
    await dataModel.updateMany({ plan: "3GB" }, { $set: { volumeRatio: 3 } });
    await dataModel.updateMany({ plan: "5GB" }, { $set: { volumeRatio: 5 } });
    await dataModel.updateMany({ plan: "10GB" }, { $set: { volumeRatio: 10 } });
    await dataModel.updateMany({ plan: "15GB" }, { $set: { volumeRatio: 15 } });
    await dataModel.updateMany({ plan: "20GB" }, { $set: { volumeRatio: 20 } });
    await Notification.create({ msg: "Hello World" });

    console.log("Success!!");
    process.exit(0);
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

populate();
