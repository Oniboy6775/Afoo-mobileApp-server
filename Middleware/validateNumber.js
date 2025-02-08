const validateNumber = (req, res, next) => {
  num = req.body.mobile_number;
  num = num.replace(/\s/g, "");
  if (num.length < 11) {
    return res.status(400).json({ msg: "Invalid number" });
  }
  if (num.startsWith("234")) {
    if (num.length < 13) return res.status(400).json({ msg: "Invalid number" });
    num = "0" + num.substr(3);
  }
  req.body.mobile_number = num;
  next();
};
module.exports = validateNumber;
