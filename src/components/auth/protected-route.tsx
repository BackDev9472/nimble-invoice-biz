import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { isDeviceRemembered } from "@/lib/device-remember";
import Loading from "../loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, userAuthStatus, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userAuthStatus != "authenticated") {
      navigate("/auth");
    }
  }, [user, userAuthStatus, loading, navigate]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};
