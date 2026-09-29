const AppError = require("../utils/AppError");

module.exports = (schema) => (req, res, next) => {
  const numericKeys = ["amount", "targetAmount", "currentAmount", "contribution", "month", "year"];
  numericKeys.forEach((key) => {
    if (req.body?.[key] !== undefined && req.body[key] !== "" && typeof req.body[key] === "string") {
      const n = Number(req.body[key]);
      if (!Number.isNaN(n)) req.body[key] = n;
    }
  });
  if (req.body?.isActive === "true") req.body.isActive = true;
  if (req.body?.isActive === "false") req.body.isActive = false;

  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const details = error.details.map((d) => d.message.replace(/"/g, ""));
    return next(new AppError(400, details[0], details));
  }

  req.body = value;
  next();
};
