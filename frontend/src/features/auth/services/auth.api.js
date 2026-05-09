import api from "../../../shared/api";

export const login = (creds) => api.post("/auth/login", creds);
export const register = (data) => api.post("/auth/register", data);
export const getMe = () => api.get("/auth/me");
export const changePassword = (data) => api.patch("/auth/change-password", data);
