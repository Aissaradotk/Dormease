import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="page-loading">กำลังโหลด...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && profile?.role !== role) {
    return <Navigate to={profile?.role === "owner" ? "/dashboard" : "/my-room"} replace />;
  }
  return children;
}
