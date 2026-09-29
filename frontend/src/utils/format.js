export function formatMoney(amount, currency = "USD") {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatSignedMoney(amount, currency = "USD") {
  const value = Number(amount) || 0;
  const formatted = formatMoney(Math.abs(value), currency);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

export function formatDate(value, pattern = "MMM d, yyyy") {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  // Values with no time-of-day component (stored as UTC midnight) represent a
  // calendar date the user picked — a transaction date, a budget/goal target
  // date, a recurring start date. Those must show the same calendar day for
  // every viewer no matter their local timezone, so we read them back with UTC
  // getters. Values that carry a real time-of-day (e.g. the dashboard's "right
  // now" timestamp) are genuine instants and should stay localized to the viewer.
  const isPureDate =
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0;

  const year = isPureDate ? d.getUTCFullYear() : d.getFullYear();
  const month = isPureDate ? d.getUTCMonth() : d.getMonth();
  const day = isPureDate ? d.getUTCDate() : d.getDate();

  if (pattern === "MM/DD/YYYY") {
    return `${String(month + 1).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
  }
  if (pattern === "DD/MM/YYYY") {
    return `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
  }
  if (pattern === "YYYY-MM-DD") {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return new Date(Date.UTC(year, month, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function greetingFor(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function displayName(user) {
  if (!user) return "there";
  if (user.fullName) return user.fullName.split(" ")[0];
  return user.username;
}

export function toInputDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export const PAYMENT_METHOD_LABELS = {
  cash: "Cash",
  debit_card: "Debit Card",
  credit_card: "Credit Card",
  bank_transfer: "Bank Transfer",
  upi: "UPI",
  other: "Other",
};

export const FREQUENCY_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export function progressColor(percent) {
  if (percent >= 100) return "bg-rose-500";
  if (percent >= 80) return "bg-amber-500";
  return "bg-emerald-500";
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}



// export function formatMoney(amount, currency = "USD") {
//   const value = Number(amount) || 0;
//   try {
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency,
//       maximumFractionDigits: 2,
//     }).format(value);
//   } catch {
//     return `${currency} ${value.toFixed(2)}`;
//   }
// }

// export function formatSignedMoney(amount, currency = "USD") {
//   const value = Number(amount) || 0;
//   const formatted = formatMoney(Math.abs(value), currency);
//   if (value > 0) return `+${formatted}`;
//   if (value < 0) return `-${formatted}`;
//   return formatted;
// }

// export function formatDate(value, pattern = "MMM d, yyyy") {
//   if (!value) return "—";
//   const d = new Date(value);
//   if (Number.isNaN(d.getTime())) return "—";

//   if (pattern === "MM/DD/YYYY") {
//     return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
//   }
//   if (pattern === "DD/MM/YYYY") {
//     return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
//   }
//   if (pattern === "YYYY-MM-DD") {
//     return d.toISOString().slice(0, 10);
//   }
//   return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
// }

// export function greetingFor(date = new Date()) {
//   const h = date.getHours();
//   if (h < 12) return "Good morning";
//   if (h < 17) return "Good afternoon";
//   return "Good evening";
// }

// export function displayName(user) {
//   if (!user) return "there";
//   if (user.fullName) return user.fullName.split(" ")[0];
//   return user.username;
// }

// export function toInputDate(value) {
//   if (!value) return "";
//   const d = new Date(value);
//   if (Number.isNaN(d.getTime())) return "";
//   const tz = d.getTimezoneOffset() * 60000;
//   return new Date(d.getTime() - tz).toISOString().slice(0, 10);
// }

// export const PAYMENT_METHOD_LABELS = {
//   cash: "Cash",
//   debit_card: "Debit Card",
//   credit_card: "Credit Card",
//   bank_transfer: "Bank Transfer",
//   upi: "UPI",
//   other: "Other",
// };

// export const FREQUENCY_LABELS = {
//   daily: "Daily",
//   weekly: "Weekly",
//   monthly: "Monthly",
//   yearly: "Yearly",
// };

// export function progressColor(percent) {
//   if (percent >= 100) return "bg-rose-500";
//   if (percent >= 80) return "bg-amber-500";
//   return "bg-emerald-500";
// }

// export function downloadBlob(blob, filename) {
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   a.click();
//   window.URL.revokeObjectURL(url);
// }
