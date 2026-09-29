import api from "./api";

export const listTransactions = (params) => api.get("/transactions", { params });
export const getTransaction = (id) => api.get(`/transactions/${id}`);
export const createTransaction = (payload) => {
  if (payload instanceof FormData) {
    return api.post("/transactions", payload);
  }
  return api.post("/transactions", payload);
};
export const updateTransaction = (id, payload) => {
  if (payload instanceof FormData) {
    return api.patch(`/transactions/${id}`, payload);
  }
  return api.patch(`/transactions/${id}`, payload);
};
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

export const receiptViewUrl = (id) => `${api.defaults.baseURL}/transactions/${id}/receipt`;

export const exportTransactionsCsv = async () => {
  const res = await api.get("/transactions/export", { responseType: "blob" });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = "budget-buddy-transactions.csv";
  a.click();
  window.URL.revokeObjectURL(url);
};
