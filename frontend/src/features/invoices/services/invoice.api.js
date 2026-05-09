import api from "../../../shared/api";

export const getInvoices = (params) => api.get("/invoices", { params });
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const getDashboard = () => api.get("/invoices/stats/dashboard");
export const createInvoice = (data) => api.post("/invoices", data);
export const updateInvoice = (id, data) => api.patch(`/invoices/${id}`, data);
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`);
export const markPaid = (id) => api.patch(`/invoices/${id}/mark-paid`);
export const uploadCSV = (formData) => api.post("/invoices/upload-csv", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
