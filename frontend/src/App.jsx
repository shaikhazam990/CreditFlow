import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AppRoutes from "./app.routes";
import useAuth from "./features/auth/hooks/useAuth";
import "./shared/styles/global.scss";

const AppInit = () => {
  const { fetchMe, token } = useAuth();

  // On mount, if a token exists in localStorage, fetch the current user
  useEffect(() => {
    if (token) fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <AppRoutes />;
};

const App = () => (
  <BrowserRouter>
    <AppInit />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          fontFamily: "DM Sans, system-ui, sans-serif",
          fontSize: "13px",
          border: "1px solid #e5e5e3",
          borderRadius: "6px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.07)",
          color: "#1a1a19",
          background: "#ffffff",
          maxWidth: 360,
        },
        success: { iconTheme: { primary: "#3d7a5e", secondary: "#fff" } },
        error:   { iconTheme: { primary: "#c0392b", secondary: "#fff" } },
      }}
    />
  </BrowserRouter>
);

export default App;
