import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "../../../shared/components/Loader";

const Protected = ({ children }) => {
  const { token, initialized } = useSelector((s) => s.auth);
  const localToken = localStorage.getItem("token");

  console.log("🔒 Protected check:", { token, initialized, localToken });

  if (!localToken && !token) return <Navigate to="/login" replace />;
  if (!initialized) return <Loader fullPage />;
  if (!token) return <Navigate to="/login" replace />;

  return children;
};

export default Protected;