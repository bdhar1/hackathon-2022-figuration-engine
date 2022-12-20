exports.get404 = (req, res, next) => {
  console.log("".concat(req.path, " not found."));
  res.status(404).json({ errorCode: 001, message: 'Path not found' });
};
