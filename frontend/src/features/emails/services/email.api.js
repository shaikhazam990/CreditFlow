import api from "../../../shared/api";

export const getLogs = (params) => api.get("/emails/logs", { params });
export const getLog = (id) => api.get(`/emails/logs/${id}`);
export const sendEmail = (invoiceId, data) => api.post(`/emails/send/${invoiceId}`, data);
export const previewEmail = (invoiceId, data) => api.post(`/emails/preview/${invoiceId}`, data);
