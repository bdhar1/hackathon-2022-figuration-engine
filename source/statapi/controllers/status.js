const stats = require('../models/stats');

exports.getStatus = async (req, res, next) => {
  console.log("".concat("Processing for api/", req.path));
  const reply = await stats.getStats();
  res.status(200).json(reply);
}