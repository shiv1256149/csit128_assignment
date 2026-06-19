// express 4 doesn't catch async route rejections; routes them to error middleware instead
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
