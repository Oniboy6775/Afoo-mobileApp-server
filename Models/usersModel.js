const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please provide email"],

    validate: {
      validator: validator.isEmail,
      message: "Please provide valid email",
    },
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "enter a password"],
  },
  referredBy: { type: String, lowercase: true },
  referrals: [
    {
      userName: "",
      email: "",
      amountEarn: 0,
    },
  ],
  userName: { type: String, required: true, lowercase: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },

  balance: { type: Number },
  earningBalance: { type: Number },
  apiToken: { type: String },
  reservedAccountBank: { type: String },
  reservedAccountNo: { type: String },
  reservedAccountBank2: { type: String },
  reservedAccountNo2: { type: String },
  reservedAccountBank3: { type: String }, //Vpay
  reservedAccountNo3: { type: String },
  reservedAccountBank4: { type: String }, //pay vessel
  reservedAccountNo4: { type: String },
  accountNumbers: [{ bankName: String, accountNumber: String }],
  userType: {
    type: String,
    default: "smart earner",
    enum: ["smart earner", "reseller", "api user", "partner"],
  },
  // partner related fields
  isPartner: { type: Boolean, default: false },
  withdrawalDetails: {
    bank: "",
    bankCode: "",
    accountNumber: "",
    nameOnAccount: "",
  },
  isSpecial: { type: Boolean, default: false },
  specialPrices: [{ productName: "", price: "" }],
  balance: { type: Number, default: 0 },
  lastLogin: { type: Date },
  webhookUrl: { type: String },
  fullName: { type: String, default: "" },
  bvn: { type: String, default: "" },
  nin: { type: String, default: "" },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
// userSchema.pre("save", async function () {
//   if (!this.isModified("userPin")) return;
//   const salt = await bcrypt.genSalt(10);
//   this.userPin = await bcrypt.hash(this.userPin, salt);
// });

userSchema.methods.comparePassword = async function (canditatePassword) {
  const isMatch = await bcrypt.compare(canditatePassword, this.password);
  return isMatch;
};
// userSchema.methods.compareUserPin = async function (userPin) {
//   const isMatch = await bcrypt.compare(userPin, this.userPin);
//   return isMatch;
// };

userSchema.methods.createJWT = function () {
  return jwt.sign(
    {
      userId: this._id,
      userType: this.userType,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

// Virtual getter to handle empty KYC details
// userSchema.virtual("formattedKycDetails", {
//   get() {
//     const { fullName, bvn, nin } = this.kycDetails;
//     return {
//       fullName: fullName || "",
//       bvn: bvn || "",
//       nin: nin || "",
//     };
//   },
// });

module.exports = mongoose.model("User", userSchema);
