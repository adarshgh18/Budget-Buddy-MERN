import api from "./api";

export const getDashboard = () => api.get("/dashboard");
export const getAnalytics = (params) => api.get("/analytics", { params });
export const getInsights = () => api.get("/analytics/insights");
