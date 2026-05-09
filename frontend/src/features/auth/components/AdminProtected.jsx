import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "../../../shared/components/Loader";

const AdminProtected = ({ children }) => {
  const { user, initialized } = useSelector((s) => s.auth);

  // Still fetching user profile — don't redirect yet
  if (!initialized) return <Loader fullPage />;

  // Initialized but not admin — redirect
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
};

export default AdminProtected;