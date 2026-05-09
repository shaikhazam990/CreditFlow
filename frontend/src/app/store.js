import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import invoicesReducer from "../features/invoices/invoicesSlice";
import emailsReducer from "../features/emails/emailsSlice";
import notificationsReducer from "../features/notifications/notificationsSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    invoices: invoicesReducer,
    emails: emailsReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
