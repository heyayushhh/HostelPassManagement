import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  role: "student" | "warden" | "guard";
}

export default function AuthLayout({ children, role }: AuthLayoutProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!isLoading && !user) {
      navigate("/");
      return;
    }

    // If user doesn't have the required role, redirect
    if (!isLoading && user && user.role !== role) {
      if (user.role === "student") {
        navigate("/student/dashboard");
      } else if (user.role === "warden") {
        navigate("/warden/dashboard");
      } else if (user.role === "guard") {
        navigate("/guard/dashboard");
      }
    }
  }, [user, isLoading, navigate, role]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only render children if user has the correct role
  if (user && user.role === role) {
    return <>{children}</>;
  }

  return null;
}
