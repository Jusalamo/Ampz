import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Connect from "./pages/Connect";
import Chats from "./pages/Chats";
import Profile from "./pages/Profile";
import EventDetail from "./pages/EventDetail";
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import PrivacySettings from "./pages/PrivacySettings";
import Social from "./pages/Social";
import Activity from "./pages/Activity";
import EventManager from "./pages/EventManager";
import EventCheckIn from "./pages/EventCheckIn";
import NotFound from "./pages/NotFound";

import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

/* -------------------------------------------------------
   Protected Route
-------------------------------------------------------- */

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

/* -------------------------------------------------------
   Routes
-------------------------------------------------------- */

function AppRoutes() {
  const { isAuthenticated } = useApp();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/home" replace /> : <Landing />
        }
      />
      <Route path="/landing" element={<Landing />} />
      <Route
        path="/auth"
        element={
          isAuthenticated ? <Navigate to="/home" replace /> : <Auth />
        }
      />

      {/* Public Check-In */}
      <Route path="/event/:id/checkin" element={<EventCheckIn />} />

      {/* Protected */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <Events />
          </ProtectedRoute>
        }
      />
      <Route
        path="/connect"
        element={
          <ProtectedRoute>
            <Connect />
          </ProtectedRoute>
        }
      />
      <Route path="/connections" element={<Navigate to="/connect" replace />} />
      <Route
        path="/matches"
        element={
          <ProtectedRoute>
            <Chats />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chats"
        element={
          <ProtectedRoute>
            <Chats />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/event/:id"
        element={
          <ProtectedRoute>
            <EventDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/social"
        element={
          <ProtectedRoute>
            <Social />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <Activity />
          </ProtectedRoute>
        }
      />
      <Route
        path="/event-manager"
        element={
          <ProtectedRoute>
            <EventManager />
          </ProtectedRoute>
        }
      />

      {/* Settings */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/edit-profile"
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/privacy"
        element={
          <ProtectedRoute>
            <PrivacySettings />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/* -------------------------------------------------------
   App Root
-------------------------------------------------------- */

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
