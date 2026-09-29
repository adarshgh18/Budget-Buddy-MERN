exports.success = (res, data = {}, statusCode = 200, message = "OK") => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
