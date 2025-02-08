const generateBillStackAcc = require("../Utils/generateBillStackAcc");

const generateAccount = async (req, res) => {
  const { bankName } = req.body;
  const userId = req.user.userId;
  const generate = await generateBillStackAcc({ bankName, userId });
  //   console.log(generate);
  if (generate.status) {
    res.status(200).json({
      msg: `Your ${bankName} account has been generated successfully`,
    });
  } else {
    res.status(400).json({ msg: generate.msg || "Failed to generate account" });
  }
};
module.exports = { generateAccount };
