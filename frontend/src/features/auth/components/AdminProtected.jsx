import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "../../../shared/components/Loader";

const AdminProtected = ({ children }) => {
  const { user, initialized } = useSelector((s) => s.auth);

  if (!initialized) return <Loader fullPage />;

  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
};

export default AdminProtected;