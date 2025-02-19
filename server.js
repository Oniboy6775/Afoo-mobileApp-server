const express = require("express");
const app = express();
const Axios = require("axios");

const ConnectDB = require("./Controllers/ConnectB");
const auth = require("./Middleware/auth");
const { dirname } = require("path");
const { fileURLToPath } = require("url");
const path = require("path");
const schedule = require("node-schedule");

const DataModel = require("./Models/dataModel");
const User = require("./Models/usersModel");

// ROUTERS
const purchaseRouter = require("./Routes/purchaseRouter");
const usersRouter = require("./Routes/usersRouter");
const fundWalletRouter = require("./Routes/fundWalletRouter");
const adminRouter = require("./Routes/adminRouter");
const transactionRoute = require("./Routes/transactionsRouter");
const withdrawalRoute = require("./Routes/withdrawalRouter");
const webhookRoute = require("./Routes/webhookRoutes");
const sellAirtimeRouter = require("./Routes/sellAirtimeRouter");
const dataPlanRoutes = require("./Routes/dataPlanRoutes");
const OTPRoutes = require("./Routes/OTPRouter");
const generateAcc = require("./Routes/generateAccRoutes");
const pushNotificationRouter = require("./Routes/pushNotificationRoutes");

// extra security packages
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const morgan = require("morgan");

const PORT = process.env.PORT || 5000;
// Middleware
app.use(cors());

require("dotenv").config();
app.set("trust proxy", 1);

app.use(express.json());
app.use(helmet());
app.use(xss());

app.all("/api/v1/prices", async (req, res) => {
  const { network } = req.body;
  try {
    let queryObj = {};
    if (network) {
      queryObj.plan_network = network;
    }
    const dataList = await DataModel.find(queryObj).select(
      "-planCostPrice -volumeRatio -partnerPrice"
    );
    return res.status(200).json(dataList);
  } catch (e) {
    return res.status(500).json({ msg: "An error occur" });
  }
});

app.use(morgan("dev"));
app.use("/api/v1/auth", usersRouter);
app.use("/api/v1/buy", auth, purchaseRouter);
app.use("/api/v1/fundWallet", fundWalletRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/transaction", auth, transactionRoute);
app.use("/api/v1/withdraw", auth, withdrawalRoute);
app.use("/api/v1/webhook", webhookRoute);
app.use("/api/v1/A2C", sellAirtimeRouter);
app.use("/api/v1/dataPlan", dataPlanRoutes);
app.use("/api/v1/otp", OTPRoutes);
app.use("/api/v1/generateAcc", generateAcc);
app.use("/api/v1/pushNotification", pushNotificationRouter);

const start = async () => {
  try {
    console.log("connecting to database...");
    await ConnectDB(process.env.MONGODB_URI);
    app.listen(PORT, () => {
      console.log(process.env.NODE_ENV);
      console.log(`DB CONNECTED & app listening on port: ${PORT}...`);
    });
  } catch (error) {
    console.log(error.message);
  }
};

app.use("/api/v1/*", (req, res) => {
  res.status(404).json({ msg: "route not found" });
});
app.use("/", (req, res) => {
  res.status(200).json({ msg: "The server is working fine" });
});

start();
