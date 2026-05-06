import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ allowedRoles = [], requiredPermissions = [], redirectTo = "/login" }) {
  const { auth } = useAuth();

  const hasRole = allowedRoles.length === 0 || allowedRoles.includes(auth.role);
  const hasPermissions = requiredPermissions.every((perm) => auth.permissions.includes(perm));
  const isAllowed = Boolean(auth.token) && hasRole && hasPermissions;

  return isAllowed ? <Outlet /> : <Navigate to={redirectTo} replace />;
}
