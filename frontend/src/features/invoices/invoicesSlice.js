import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as invoiceApi from "./services/invoice.api";
import toast from "react-hot-toast";

export const fetchInvoices = createAsyncThunk("invoices/fetch", async (params, { rejectWithValue }) => {
  try {
    const { data } = await invoiceApi.getInvoices(params);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchDashboard = createAsyncThunk("invoices/dashboard", async (_, { rejectWithValue }) => {
  try {
    const { data } = await invoiceApi.getDashboard();
    return data.stats;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createInvoice = createAsyncThunk("invoices/create", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await invoiceApi.createInvoice(payload);
    toast.success("Invoice created.");
    return data.invoice;
  } catch (err) {
    const msg = err.response?.data?.message || "Create failed.";
    toast.error(msg);
    return rejectWithValue(msg);
  }
});

export const updateInvoice = createAsyncThunk("invoices/update", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data } = await invoiceApi.updateInvoice(id, payload);
    toast.success("Invoice updated.");
    return data.invoice;
  } catch (err) {
    const msg = err.response?.data?.message || "Update failed.";
    toast.error(msg);
    return rejectWithValue(msg);
  }
});

export const deleteInvoice = createAsyncThunk("invoices/delete", async (id, { rejectWithValue }) => {
  try {
    await invoiceApi.deleteInvoice(id);
    toast.success("Invoice deleted.");
    return id;
  } catch (err) {
    toast.error("Delete failed.");
    return rejectWithValue(err.response?.data?.message);
  }
});

export const markPaid = createAsyncThunk("invoices/markPaid", async (id, { rejectWithValue }) => {
  try {
    const { data } = await invoiceApi.markPaid(id);
    toast.success("Invoice marked as paid.");
    return data.invoice;
  } catch (err) {
    toast.error("Action failed.");
    return rejectWithValue(err.response?.data?.message);
  }
});

const invoicesSlice = createSlice({
  name: "invoices",
  initialState: {
    items: [],
    total: 0,
    pages: 1,
    currentPage: 1,
    loading: false,
    dashboardStats: null,
    statsLoading: false,
    error: null,
  },
  reducers: {
    upsertInvoice(state, action) {
      const idx = state.items.findIndex((i) => i._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
      else state.items.unshift(action.payload);
    },
    removeInvoice(state, action) {
      state.items = state.items.filter((i) => i._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (s) => { s.loading = true; })
      .addCase(fetchInvoices.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.invoices;
        s.total = a.payload.total;
        s.pages = a.payload.pages;
        s.currentPage = a.payload.page;
      })
      .addCase(fetchInvoices.rejected, (s) => { s.loading = false; })

      .addCase(fetchDashboard.pending, (s) => { s.statsLoading = true; })
      .addCase(fetchDashboard.fulfilled, (s, a) => { s.statsLoading = false; s.dashboardStats = a.payload; })
      .addCase(fetchDashboard.rejected, (s) => { s.statsLoading = false; })

      .addCase(createInvoice.fulfilled, (s, a) => { s.items.unshift(a.payload); s.total += 1; })
      .addCase(updateInvoice.fulfilled, (s, a) => {
        const idx = s.items.findIndex((i) => i._id === a.payload._id);
        if (idx !== -1) s.items[idx] = a.payload;
      })
      .addCase(deleteInvoice.fulfilled, (s, a) => {
        s.items = s.items.filter((i) => i._id !== a.payload);
        s.total -= 1;
      })
      .addCase(markPaid.fulfilled, (s, a) => {
        const idx = s.items.findIndex((i) => i._id === a.payload._id);
        if (idx !== -1) s.items[idx] = a.payload;
      });
  },
});

export const { upsertInvoice, removeInvoice } = invoicesSlice.actions;
export default invoicesSlice.reducer;
