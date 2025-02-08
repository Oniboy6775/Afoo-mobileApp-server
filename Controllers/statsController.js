const Transaction = require("../Models/transactionModel");
const { StatusCodes } = require("http-status-codes");
const getStat = async (req, res) => {
  //   return res.sendStatus(200);
  let start = new Date().setHours(-1, -1, -1, -1);
  let end = new Date().setHours(23, 59, 59, 999);
  const ADMIN_ID = process.env.ADMIN_ID;
  let isAdmin = ADMIN_ID === req.user.userId;

  try {
    const today = await Transaction.find({
      createdAt: { $gte: start, $lt: end },
    });
    let total5GB = today
      .filter((e) => {
        return (
          e.trans_Network.startsWith("MTN") &&
          e.trans_UserName != "oniboy" &&
          e.trans_volume_ratio == 5 &&
          e.trans_Status == "success"
        );
      })
      .reduce((acc, cur) => {
        acc += cur.trans_volume_ratio;
        return acc;
      }, 0);
    let total5GBProfit = total5GB * 2 * 245;
    // Calculating total GB purchased
    const totalSales = today.reduce((acc, cur) => {
      acc += cur.trans_volume_ratio;
      return acc;
    }, 0);
    // Calculating profit for selected transactions
    const totalProfit = today.reduce((acc, cur) => {
      const currentProfit = isNaN(cur.trans_profit) ? 0 : cur.trans_profit;
      acc += currentProfit;
      return acc;
    }, 0);

    const calculateMoneyFlow = (type) => {
      let total = 0;
      const ADMIN = process.env.ADMIN_ID;
      if (type === "DEBIT") {
        const totalDebit = today.reduce((acc, cur) => {
          if (
            cur.balance_After < cur.balance_Before &&
            cur.trans_By !== ADMIN &&
            cur.trans_Status !== "refunded"
          ) {
            acc += cur.trans_amount;
          }
          return acc;
        }, 0);
        total = totalDebit;
      }
      if (type === "CREDIT") {
        const totalCredit = today.reduce((acc, cur) => {
          if (
            cur.balance_After > cur.balance_Before &&
            cur.trans_By !== ADMIN &&
            cur.trans_Type !== "refund"
          ) {
            acc += cur.trans_amount;
          }
          return acc;
        }, 0);
        total = totalCredit;
      }
      return total;
    };
    const calculateStat = (network, type) => {
      let result = {
        network: `${network} ${type}`,
        profit: 0,
        total_volume_sold: 0,
      };
      let filtered = today.filter(
        (e) =>
          e.trans_Type &&
          e.trans_Network.split(" ")[0] === network &&
          e.trans_Network.split(" ")[1] === type
      );
      // profit
      result.profit = filtered.reduce((acc, cur) => {
        const currentProfit = isNaN(cur.trans_profit) ? 0 : cur.trans_profit;
        acc += currentProfit;
        return acc;
      }, 0);
      // total sales
      result.total_volume_sold = filtered.reduce((acc, cur) => {
        acc += cur.trans_volume_ratio;
        return acc;
      }, 0);
      return result;
    };

    let mtnSMESales = calculateStat("MTN", "SME");
    let mtnSME2Sales = calculateStat("MTN", "SME2");
    let mtnCGSales = calculateStat("MTN", "CG");
    let mtnDIRECTSales = calculateStat("MTN", "DATA_TRANSFER");
    let mtnAwoofSales = calculateStat("MTN", "AWOOF");
    let AirtelCGSales = calculateStat("AIRTEL", "CG");
    let gloCGSales = calculateStat("GLO", "CG");
    let NmobileCGSales = calculateStat("9MOBILE", "CG");
    let NmobileSMESales = calculateStat("9MOBILE", "SME");
    let totalDebit = calculateMoneyFlow("DEBIT");
    let totalCredit = calculateMoneyFlow("CREDIT");
    // let mtnCOUPONSales = calculateStat("MTN", "COUPON");
    // let gloSMESales = calculateStat("GLO", "SME");
    // let AirtelSMESales = calculateStat("AIRTEL", "SME");

    res.status(StatusCodes.OK).json({
      totalSales,
      totalProfit: totalProfit + total5GBProfit,
      totalDebit,
      totalCredit,
      stat: isAdmin
        ? [
            mtnSMESales,
            mtnSME2Sales,
            mtnCGSales,
            mtnDIRECTSales,
            mtnAwoofSales,
            gloCGSales,
            AirtelCGSales,
            NmobileCGSales,
            NmobileSMESales,
            (total5GB = {
              network: `5GB ONLY`,
              profit: total5GBProfit,
              total_volume_sold: total5GB,
            }),
          ]
        : [],
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports = { getStat };
