import api from "./api";

export const listGoals = () => api.get("/goals");
export const createGoal = (payload) => api.post("/goals", payload);
export const updateGoal = (id, payload) => api.patch(`/goals/${id}`, payload);
export const deleteGoal = (id) => api.delete(`/goals/${id}`);
