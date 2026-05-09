import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminProtected = ({ children }) => {
  const { user } = useSelector((s) => s.auth);
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
};

export default AdminProtected;
