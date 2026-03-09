import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

import Home from "@/pages/Home";
import About from "@/pages/About";
import Solutions from "@/pages/Solutions";
import Frameworks from "@/pages/Frameworks";
import Engagement from "@/pages/Engagement";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/portal/Dashboard";
import BMCTool from "@/pages/portal/BMCTool";
import SWOTPestleTool from "@/pages/portal/SWOTPestleTool";
import ValuePropTool from "@/pages/portal/ValuePropTool";
import PitchBuilderTool from "@/pages/portal/PitchBuilderTool";
import ProgressTrackerTool from "@/pages/portal/ProgressTrackerTool";
import FinancialAnalysisTool from "@/pages/portal/FinancialAnalysisTool";
import Profile from "@/pages/portal/Profile";
import NotFound from "@/pages/not-found";
import { FloatingChat } from "@/components/FloatingChat";
import { ErrorBoundary } from "@/components/portal/ErrorBoundary";

// CI/CD Automation Test - This PR will be auto-reviewed and approved if all checks pass

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}<FloatingChat /></>;
}

function Router() {
  return (
    <>
    <ScrollToTop />
    <Switch>
      {/* Marketing Pages */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/solutions" component={Solutions} />
      <Route path="/solutions/entrepreneurs" component={Solutions} />
      <Route path="/solutions/programmes" component={Solutions} />
      <Route path="/frameworks" component={Frameworks} />
      <Route path="/engagement" component={Engagement} />
      <Route path="/contact" component={Contact} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />

      {/* Portal Routes (Protected) */}
      <Route path="/portal">
        <ProtectedRoute>
          <ErrorBoundary><Dashboard /></ErrorBoundary>
        </ProtectedRoute>
      </Route>
      <Route path="/portal/tools/bmc">
        <ProtectedRoute>
          <ErrorBoundary><BMCTool /></ErrorBoundary>
        </ProtectedRoute>
      </Route>
      <Route path="/portal/tools/analysis">
        <ProtectedRoute>
          <ErrorBoundary><SWOTPestleTool /></ErrorBoundary>
        </ProtectedRoute>
      </Route>
      <Route path="/portal/tools/value-prop">
        <ProtectedRoute>
          <ErrorBoundary><ValuePropTool /></ErrorBoundary>
        </ProtectedRoute>
      </Route>
      <Route path="/portal/tools/pitch">
        <ProtectedRoute>
          <ErrorBoundary><PitchBuilderTool /></ErrorBoundary>
        </ProtectedRoute>
      </Route>
      <Route path="/portal/tools/progress">
        <ProtectedRoute>
          <ErrorBoundary><ProgressTrackerTool /></ErrorBoundary>
        </ProtectedRoute>
      </Route>
      <Route path="/portal/tools/financials">
        <ProtectedRoute>
          <ErrorBoundary><FinancialAnalysisTool /></ErrorBoundary>
        </ProtectedRoute>
      </Route>
      <Route path="/portal/profile">
        <ProtectedRoute>
          <ErrorBoundary><Profile /></ErrorBoundary>
        </ProtectedRoute>
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
