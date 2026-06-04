import React from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LangProvider } from "@/contexts/LangProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import MemberDashboard from "@/pages/MemberDashboard";
import Spaces from "@/pages/Spaces";
import SpaceDetail from "@/pages/SpaceDetail";
import TaskDetail from "@/pages/TaskDetail";
import Timeline from "@/pages/Timeline";
import Members from "@/pages/Members";
import Senders from "@/pages/Senders";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import Attendance from "@/pages/Attendance";
import WeeklyReport from "@/pages/WeeklyReport";
import Bugs from "@/pages/Bugs";
import Goals from "@/pages/Goals";
import MyTasks from "@/pages/MyTasks";
import Sprints from "@/pages/Sprints";
import Inbox from "@/pages/Inbox";
import Portfolio from "@/pages/Portfolio";
import Chat from "@/pages/Chat";
import Forms from "@/pages/Forms";
import Automations from "@/pages/Automations";
import PublicForm from "@/pages/PublicForm";
import NotFound from "@/pages/not-found";
import { useActivityWatcher } from "@/hooks/useActivityWatcher";
import { useChatNotifications } from "@/hooks/useChatNotifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchInterval: 2 * 60 * 1000,
      refetchIntervalInBackground: false,
    },
  },
});

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

function PublicRoute({ component: Component }: { component: () => React.ReactElement }) {
  const { userDoc, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (userDoc) return <Redirect to="/" />;
  return <Component />;
}

/**
 * Renders AppLayout once for all protected routes so the Sidebar is never
 * unmounted on navigation (prevents sidebar animations from replaying).
 */
function ChatNotificationsWatcher() {
  useChatNotifications();
  return null;
}

function ProtectedSwitch() {
  const { userDoc, loading, isAdmin } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!userDoc) return <Redirect to="/login" />;

  return (
    <AppLayout>
      <ChatNotificationsWatcher />
      <Switch>
        <Route path="/" component={() => isAdmin ? <Dashboard /> : <MemberDashboard />} />
        <Route path="/spaces" component={Spaces} />
        <Route path="/spaces/:spaceId" component={SpaceDetail} />
        <Route path="/spaces/:spaceId/tasks/:taskId" component={TaskDetail} />
        <Route path="/timeline" component={() => isAdmin ? <Timeline /> : <Redirect to="/" />} />
        <Route path="/members" component={() => isAdmin ? <Members /> : <Redirect to="/" />} />
        <Route path="/senders" component={() => isAdmin ? <Senders /> : <Redirect to="/" />} />
        <Route path="/history" component={() => isAdmin ? <History /> : <Redirect to="/" />} />
        <Route path="/settings" component={Settings} />
        <Route path="/attendance" component={Attendance} />
        <Route path="/weekly-report" component={WeeklyReport} />
        <Route path="/bugs" component={() => isAdmin ? <Bugs /> : <Redirect to="/" />} />
        <Route path="/goals" component={Goals} />
        <Route path="/my-tasks" component={MyTasks} />
        <Route path="/sprints" component={Sprints} />
        <Route path="/inbox" component={Inbox} />
        <Route path="/portfolio" component={Portfolio} />
        <Route path="/chat" component={Chat} />
        <Route path="/forms" component={() => isAdmin ? <Forms /> : <Redirect to="/" />} />
        <Route path="/automations" component={() => isAdmin ? <Automations /> : <Redirect to="/" />} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/signup" component={() => <PublicRoute component={Signup} />} />
      <Route path="/form/:formId" component={PublicForm} />
      <Route component={ProtectedSwitch} />
    </Switch>
  );
}

function App() {
  useActivityWatcher();
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
