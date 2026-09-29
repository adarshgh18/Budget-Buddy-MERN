exports.startOfMonth = (date = new Date()) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

exports.endOfMonth = (date = new Date()) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
};

exports.startOfYear = (year) => new Date(Number(year), 0, 1);

exports.endOfYear = (year) => new Date(Number(year) + 1, 0, 1);

exports.addFrequency = (date, frequency) => {
  const next = new Date(date);
  if (frequency === "daily") next.setDate(next.getDate() + 1);
  else if (frequency === "weekly") next.setDate(next.getDate() + 7);
  else if (frequency === "yearly") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
};

exports.daysRemainingInMonth = (date = new Date()) => {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return Math.max(0, end.getDate() - date.getDate());
};

exports.monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
