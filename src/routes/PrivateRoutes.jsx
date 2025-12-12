import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAuthTokens, getActiveUser } from "../api/authservices/authservice";

const PrivateRoutes = ({ allowedRoles }) => {
  const tokens = getAuthTokens();
  const user = getActiveUser();

  console.log("PrivateRoutes -> tokens:", tokens);
  console.log("PrivateRoutes -> user:", user);
  console.log("Allowed roles:", allowedRoles);

  if (!tokens?.accessToken || !user?.role) {
    console.log("User NOT authenticated. Redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log(`User role "${user.role}" NOT allowed. Redirecting to /login`);
    return <Navigate to="/login" replace />;
  }

  console.log("User authorized. Showing route.");
  return <Outlet />;
};

export default PrivateRoutes;