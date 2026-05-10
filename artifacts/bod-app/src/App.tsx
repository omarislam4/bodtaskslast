import React from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LangProvider } from "@/contexts/LangContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Spaces from "@/pages/Spaces";
import SpaceDetail from "@/pages/SpaceDetail";
import TaskDetail from "@/pages/TaskDetail";
import Timeline from "@/pages/Timeline";
import Members from "@/pages/Members";
import Senders from "@/pages/Senders";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component, adminOnly }: { component: () => React.ReactElement; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (adminOnly && !isAdmin) return <Redirect to="/spaces" />;
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function PublicRoute({ component: Component }: { component: () => React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Redirect to="/spaces" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/signup" component={() => <PublicRoute component={Signup} />} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} adminOnly />} />
      <Route path="/spaces" component={() => <ProtectedRoute component={Spaces} />} />
      <Route path="/spaces/:spaceId" component={() => <ProtectedRoute component={SpaceDetail} />} />
      <Route path="/spaces/:spaceId/tasks/:taskId" component={() => <ProtectedRoute component={TaskDetail} />} />
      <Route path="/timeline" component={() => <ProtectedRoute component={Timeline} adminOnly />} />
      <Route path="/members" component={() => <ProtectedRoute component={Members} adminOnly />} />
      <Route path="/senders" component={() => <ProtectedRoute component={Senders} adminOnly />} />
      <Route path="/history" component={() => <ProtectedRoute component={History} adminOnly />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
      </LangProvider>
    </QueryClientProvider>
  );
}

export default App;
