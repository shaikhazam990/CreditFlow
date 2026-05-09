import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authApi from "./services/auth.api";
import toast from "react-hot-toast";

export const loginThunk = createAsyncThunk("auth/login", async (creds, { rejectWithValue }) => {
  try {
    const { data } = await authApi.login(creds);
    localStorage.setItem("token", data.token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Login failed.");
  }
});

export const registerThunk = createAsyncThunk("auth/register", async (creds, { rejectWithValue }) => {
  try {
    const { data } = await authApi.register(creds);
    localStorage.setItem("token", data.token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Registration failed.");
  }
});

export const getMeThunk = createAsyncThunk("auth/getMe", async (_, { rejectWithValue }) => {
  try {
    const { data } = await authApi.getMe();
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem("token") || null,
    loading: false,
    initialized: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.initialized = false;
      localStorage.removeItem("token");
    },
    clearError(state) {
      state.error = null;
    },
    setInitialized(state) {
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginThunk.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    builder.addCase(loginThunk.fulfilled, (s, a) => {
      s.loading = false;
      s.user = a.payload.user;
      s.token = a.payload.token;
      s.initialized = true;
      toast.success(`Welcome back, ${a.payload.user.name}!`);
    });
    builder.addCase(loginThunk.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload;
      toast.error(a.payload);
    });

    // Register
    builder.addCase(registerThunk.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    builder.addCase(registerThunk.fulfilled, (s, a) => {
      s.loading = false;
      s.user = a.payload.user;
      s.token = a.payload.token;
      s.initialized = true;
      toast.success("Account created successfully!");
    });
    builder.addCase(registerThunk.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload;
      toast.error(a.payload);
    });

    // Get Me
    builder.addCase(getMeThunk.pending, (s) => {
      s.loading = true;
    });
    builder.addCase(getMeThunk.fulfilled, (s, a) => {
      s.loading = false;
      s.user = a.payload.user;
      s.token = localStorage.getItem("token");
      s.initialized = true;
    });
    builder.addCase(getMeThunk.rejected, (s) => {
      s.loading = false;
      s.initialized = true;
      s.token = null;
      localStorage.removeItem("token");
    });
  },
});

export const { logout, clearError, setInitialized } = authSlice.actions;
export default authSlice.reducer;