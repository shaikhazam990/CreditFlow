import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginThunk, registerThunk, logout, getMeThunk } from "../authSlice";

const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, loading, initialized, error } = useSelector((s) => s.auth);

  const handleLogin = async (creds) => {
    const result = await dispatch(loginThunk(creds));
    if (!result.error) navigate("/dashboard");
  };

  const handleRegister = async (data) => {
    const result = await dispatch(registerThunk(data));
    if (!result.error) navigate("/dashboard");
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const fetchMe = () => dispatch(getMeThunk());

  return {
    user, token, loading, initialized, error,
    isAdmin: user?.role === "admin",
    handleLogin, handleRegister, handleLogout, fetchMe,
  };
};

export default useAuth;
