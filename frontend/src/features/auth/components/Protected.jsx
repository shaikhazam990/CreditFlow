import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "../../../shared/components/Loader";

const Protected = ({ children }) => {
  const { token, initialized } = useSelector((s) => s.auth);

  // If no token at all, no need to wait for initialization — go to login
  if (!token) return <Navigate to="/login" replace />;
  // Token exists but we haven't confirmed it's valid yet — show loader
  if (!initialized) return <Loader fullPage />;
  return children;
};

export default Protected;