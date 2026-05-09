import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../shared/api";

export const fetchNotifications = createAsyncThunk("notifications/fetch", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/notifications", { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const markReadThunk = createAsyncThunk("notifications/markRead", async (id) => {
  await api.patch(`/notifications/${id}/read`);
  return id;
});

export const markAllReadThunk = createAsyncThunk("notifications/markAllRead", async () => {
  await api.patch("/notifications/read-all");
});

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
  },
  reducers: {
    pushNotification(state, action) {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (s) => { s.loading = true; })
      .addCase(fetchNotifications.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.notifications;
        s.unreadCount = a.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (s) => { s.loading = false; })
      .addCase(markReadThunk.fulfilled, (s, a) => {
        const n = s.items.find((i) => i._id === a.payload);
        if (n && !n.read) { n.read = true; s.unreadCount = Math.max(0, s.unreadCount - 1); }
      })
      .addCase(markAllReadThunk.fulfilled, (s) => {
        s.items.forEach((n) => { n.read = true; });
        s.unreadCount = 0;
      });
  },
});

export const { pushNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
