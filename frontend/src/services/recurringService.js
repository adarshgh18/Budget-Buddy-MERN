import api from "./api";

export const listRecurring = () => api.get("/recurring-transactions");
export const createRecurring = (payload) => api.post("/recurring-transactions", payload);
export const updateRecurring = (id, payload) => api.patch(`/recurring-transactions/${id}`, payload);
export const deleteRecurring = (id) => api.delete(`/recurring-transactions/${id}`);
