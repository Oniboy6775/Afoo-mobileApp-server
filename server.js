const express = require("express");
const app = express();

const ConnectDB = require("./Controllers/ConnectB");
const auth = require("./Middleware/auth");
const { dirname } = require("path");
const { fileURLToPath } = require("url");
const path = require("path");

const DataModel = require("./Models/dataModel");

// const __dirname = dirname(fileURLToPath(import.meta.url));
// ROUTERS
const purchaseRouter = require("./Routes/purchaseRouter");
const usersRouter = require("./Routes/usersRouter");
const fundWalletRouter = require("./Routes/fundWalletRouter");
const adminRouter = require("./Routes/adminRouter");
const transactionRoute = require("./Routes/transactionsRouter");
const webhookRoute = require("./Routes/webhookRoutes");
const generateAcc = require("./Routes/generateAccRoutes");

// extra security packages
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");
const morgan = require("morgan");

// Swagger
// const swaggerUI = require("swagger-ui-express");
// const YAML = require("yamljs");
// const documentation = YAML.load("./swagger.yaml");
const PORT = process.env.PORT || 5000;
// app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(documentation));
// Middleware
app.use(cors());
require("dotenv").config();
app.set("trust proxy", 1);
// app.use(
//   rateLimiter({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // limit each IP to 100 requests per windowMs
//   })
// );
app.use(express.json());
app.use(helmet());
app.use(xss());

app.get("/api/v1/prices", async (req, res) => {
  try {
    const dataList = await DataModel.find();
    return res.status(200).json(dataList);
  } catch (e) {
    return res.status(500).json({ msg: "An error occur" });
  }
});

// if (process.env.NODE_ENV !== "production") {
app.use(morgan("dev"));
// }

app.use("/api/v1/auth", usersRouter);
app.use("/api/v1/buy", auth, purchaseRouter);
app.use("/api/v1/fundWallet", fundWalletRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/transaction", auth, transactionRoute);
app.use("/api/v1/webhook", webhookRoute);
app.use("/api/v1/generateAcc", generateAcc);

app.use("/api/v1/*", (req, res) => {
  console.log(req.body);
  res.status(200).json({ msg: "API is working fine" });
});
// ONLY WHEN READY TO DEPLOY

const start = async () => {
  try {
    await ConnectDB(process.env.MONGODB_URI);
    app.listen(PORT, () =>
      console.log(`DB CONNECTED & app listening on port: ${PORT}...`)
    );
  } catch (error) {
    console.log(error.message);
  }
};

// const __dirname = dirname(fileURLToPath(import.meta.url));
// app.use(express.static(__dirname + "/client/build"));

app.get("*", (req, res) => {
  // res.sendFile(path.resolve(__dirname, "./client/build", "index.html"));
  res.send("OK");
});

start();
