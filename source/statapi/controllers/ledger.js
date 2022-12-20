const ledger = require('../models/ledger');

exports.getLedger = async (req, res, next) => {
  console.log("".concat("Processing for api", req.path));

  if (!req.query.clientid) {
    res.status(400).json({message: "Client ID missing in query string"});
    return;
  }

  res.status(200).json(await ledger.getLedger(req.query.clientid));

  // console.log(req.query.clientid);
  // res.status(200).json([
  //   {date: "2022-12-15", time: "10:40:44", scrip: "RELIND", quantity: 100, operation: "BUY", price: 323.24, brokerage: 1.26, amount: 32325.26},
  //   {date: "2022-12-15", time: "10:40:44", scrip: "RELIND", quantity: 100, operation: "SELL", price: 323.24, brokerage: 0.63, amount: -32323.37}
  // ]);
}

exports.getClientIds = async (req, res, next) => {
  console.log("".concat("Processing for api", req.path));
  res.status(200).send(await ledger.getClientIds());
}