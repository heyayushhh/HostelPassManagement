import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/useAuth.tsx";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/student/Dashboard";
import WardenDashboard from "./pages/warden/Dashboard";
import GuardDashboard from "./pages/guard/Dashboard";
import NotFound from "@/pages/not-found";
import AuthLayout from "./components/layout/AuthLayout";
import { useEffect } from "react";

function App() {
  // Set document title
  useEffect(() => {
    document.title = "Campus Gate Pass System";
  }, []);

  return (
    <AuthProvider>
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/register" component={Register} />
        
        <Route path="/student/dashboard">
          {() => (
            <AuthLayout role="student">
              <StudentDashboard />
            </AuthLayout>
          )}
        </Route>
        
        <Route path="/warden/dashboard">
          {() => (
            <AuthLayout role="warden">
              <WardenDashboard />
            </AuthLayout>
          )}
        </Route>
        
        <Route path="/guard/dashboard">
          {() => (
            <AuthLayout role="guard">
              <GuardDashboard />
            </AuthLayout>
          )}
        </Route>
        
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
