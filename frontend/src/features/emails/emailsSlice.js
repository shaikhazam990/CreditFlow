import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as emailApi from "./services/email.api";
import toast from "react-hot-toast";

export const fetchEmailLogs = createAsyncThunk("emails/fetchLogs", async (params, { rejectWithValue }) => {
  try {
    const { data } = await emailApi.getLogs(params);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const sendEmailThunk = createAsyncThunk("emails/send", async ({ invoiceId, stage, dryRun }, { rejectWithValue }) => {
  try {
    const { data } = await emailApi.sendEmail(invoiceId, { stage, dryRun });
    toast.success(dryRun ? "Email preview generated (dry run)." : "Email sent successfully.");
    return data;
  } catch (err) {
    const msg = err.response?.data?.message || "Send failed.";
    toast.error(msg);
    return rejectWithValue(msg);
  }
});

export const previewEmailThunk = createAsyncThunk("emails/preview", async ({ invoiceId, stage }, { rejectWithValue }) => {
  try {
    const { data } = await emailApi.previewEmail(invoiceId, { stage });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const emailsSlice = createSlice({
  name: "emails",
  initialState: {
    logs: [],
    total: 0,
    pages: 1,
    loading: false,
    sendLoading: false,
    previewData: null,
    previewLoading: false,
    error: null,
  },
  reducers: {
    clearPreview(state) { state.previewData = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmailLogs.pending, (s) => { s.loading = true; })
      .addCase(fetchEmailLogs.fulfilled, (s, a) => {
        s.loading = false;
        s.logs = a.payload.logs;
        s.total = a.payload.total;
        s.pages = a.payload.pages;
      })
      .addCase(fetchEmailLogs.rejected, (s) => { s.loading = false; })

      .addCase(sendEmailThunk.pending, (s) => { s.sendLoading = true; })
      .addCase(sendEmailThunk.fulfilled, (s) => { s.sendLoading = false; })
      .addCase(sendEmailThunk.rejected, (s) => { s.sendLoading = false; })

      .addCase(previewEmailThunk.pending, (s) => { s.previewLoading = true; s.previewData = null; })
      .addCase(previewEmailThunk.fulfilled, (s, a) => { s.previewLoading = false; s.previewData = a.payload; })
      .addCase(previewEmailThunk.rejected, (s) => { s.previewLoading = false; });
  },
});

export const { clearPreview } = emailsSlice.actions;
export default emailsSlice.reducer;
