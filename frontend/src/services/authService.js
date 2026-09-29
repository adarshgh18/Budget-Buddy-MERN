import api from "./api";

export const register = (payload) => api.post("/auth/register", payload);
export const login = (payload) => api.post("/auth/login", payload);
export const logout = () => api.post("/auth/logout");
export const getMe = () => api.get("/auth/me");
export const updateMe = (payload) => api.patch("/auth/me", payload);
export const changePassword = (payload) => api.patch("/auth/password", payload);
export const deleteAccount = () => api.delete("/auth/account");
