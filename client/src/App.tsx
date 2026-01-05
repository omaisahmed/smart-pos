import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import AppLayout from "@/components/layout/app-layout";
import POS from "@/pages/pos";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Customers from "@/pages/customers";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Protected wrapper used to guard routes. Redirects to /login if not authenticated.
  function Protected({ children }: { children: React.ReactNode }) {
    const [, navigate] = useLocation();
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // navigate to login page
      navigate('/login');
      return null;
    }

    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Public landing */}
      <Route path="/" component={Landing} />

      {/* Protected app routes */}
      <Route path="/" nest>
        <Protected>
          <AppLayout>
            <Switch>
          <Route path="/" component={POS} />
          <Route path="/pos" component={POS} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/inventory" component={Inventory} />
              <Route path="/customers" component={Customers} />
              <Route path="/reports" component={Reports} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        </Protected>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
