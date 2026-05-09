import { Routes, Route, Navigate } from "react-router-dom";
import Protected from "./features/auth/components/Protected";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import OAuthCallback from "./pages/OAuthCallback";
import Sidebar from "./shared/components/Sidebar";
import Navbar from "./shared/components/Navbar";
import Dashboard from "./pages/Dashboard";
import Invoices from "./features/invoices/pages/Invoices";
import InvoiceDetails from "./features/invoices/pages/InvoiceDetails";
import EmailLogs from "./features/emails/pages/EmailLogs";

const AppShell = ({ children, title }) => (
  <div className="app-shell">
    <Sidebar />
    <div className="main-content">
      <Navbar title={title} />
      {children}
    </div>
  </div>
);

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/login"    element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Google OAuth callback — reads token from URL fragment, stores it, redirects */}
    <Route path="/oauth/callback" element={<OAuthCallback />} />

    {/* Protected */}
    <Route path="/dashboard" element={
      <Protected>
        <AppShell title="Dashboard"><Dashboard /></AppShell>
      </Protected>
    } />

    <Route path="/invoices" element={
      <Protected>
        <AppShell title="Invoices"><Invoices /></AppShell>
      </Protected>
    } />

    <Route path="/invoices/:id" element={
      <Protected>
        <AppShell title="Invoice Details"><InvoiceDetails /></AppShell>
      </Protected>
    } />

    <Route path="/emails" element={
      <Protected>
        <AppShell title="Email Logs"><EmailLogs /></AppShell>
      </Protected>
    } />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default AppRoutes;
