const OTPModel = require("../Models/OTPModel");
const User = require("../Models/usersModel");
const sendEmail = require("../Utils/sendMail");

const sendOTP = async (req, res) => {
  const { email, userName } = req.body;
  // console.log({ email, userName });
  if (!email || !userName)
    return res.status(400).json({ msg: "All filed are required" });

  const otp = Math.floor(1000 + Math.random() * 9000);
  try {
    // check if the email or user exist
    const userEmail = await User.findOne({ email });
    if (userEmail)
      return res
        .status(400)
        .json({ msg: "A user with this email has been registered" });

    let userUserName = await User.findOne({ userName });
    if (userUserName)
      return res
        .status(400)
        .json({ msg: "This username has been taken by other user" });
    // Check if an OTP request has been done 15 minutes ago
    const isRequestExist = await OTPModel.findOne({ userName, email });
    if (isRequestExist)
      return res.status(400).json({
        msg: "You have requested an OTP before. Kindly check your email or try again later",
      });
    await OTPModel.create({ email, userName, otp });
    await sendEmail(
      email,
      "OTP REQUEST",
      { otp, userName },
      "../templates/emailOTP.handlebars"
    );
    res.status(200).json({
      msg: "An OTP has been sent to your email. Kindly check your inbox",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Something went wrong",
    });
  }
};
const verifyOTP = async (req, res) => {
  const { email, userName, otp } = req.body;
  if (!email || !userName || !otp)
    return res.status(400).json({ msg: "All filed are required" });
  try {
    // check if the email and userName exist in database
    const storedOTP = await OTPModel.findOne({ email, userName, otp });
    if (!storedOTP) return res.status(400).json({ msg: "Invalid OTP" });
    await OTPModel.deleteOne({ email, userName });
    res.status(200).json({ msg: "OTP verified successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Something went wrong",
    });
  }
};
module.exports = { sendOTP, verifyOTP };
