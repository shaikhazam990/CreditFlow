import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import {
  fetchNotifications, markReadThunk, markAllReadThunk, pushNotification,
} from "../notificationsSlice";
import toast from "react-hot-toast";

let socket = null;

const useNotifications = () => {
  const dispatch = useDispatch();
  const { items, unreadCount, loading } = useSelector((s) => s.notifications);
  const { user } = useSelector((s) => s.auth);

  // Initialise Socket.io and subscribe to notifications
  useEffect(() => {
    if (!user?._id) return;

    if (!socket) {
      socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
        transports: ["websocket"],
        withCredentials: true,
      });
    }

    socket.emit("join", user._id);
    socket.emit("subscribe_notifications", user._id);

    socket.on("notification", (notif) => {
      dispatch(pushNotification(notif));
      toast(notif.message, { icon: "🔔", duration: 4000 });
    });

    return () => {
      socket?.off("notification");
    };
  }, [user?._id, dispatch]);

  const load = useCallback((params) => dispatch(fetchNotifications(params)), [dispatch]);
  const markRead = useCallback((id) => dispatch(markReadThunk(id)), [dispatch]);
  const markAllRead = useCallback(() => dispatch(markAllReadThunk()), [dispatch]);

  return { items, unreadCount, loading, load, markRead, markAllRead };
};

export default useNotifications;
