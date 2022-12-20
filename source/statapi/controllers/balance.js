const balances = require('../models/balance');

exports.getBalance = async (req, res, next) => {
  console.log("".concat("Processing for api", req.path));
  res.status(200).json(await balances.getBalance());
  // res.status(200).json([
  //   {name: "John Doe", amount: 20000, brokerage: 200, balance: 20000},
  //   {name: "Jane Doe", amount: 30000, brokerage: 300, balance: -10000}
  // ]);
}