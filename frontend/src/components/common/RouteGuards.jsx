import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas text-slate-500">
        Loading Budget Buddy…
      </div>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { status } = useAuth();
  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas text-slate-500">
        Loading Budget Buddy…
      </div>
    );
  }
  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
