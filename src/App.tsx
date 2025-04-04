import { Suspense, lazy } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useSupabase";

// Lazy load pages for better performance
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ThankYou = lazy(() => import("./pages/ThankYou"));

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminPlans = lazy(() => import("./pages/admin/Plans"));
const AdminAIAssistant = lazy(() => import("./pages/admin/AIAssistant"));

// Protected route component
// TEMPORARY: Authentication bypass for development
const ProtectedRoute = ({ children, requiresAdmin = false }) => {
  // Bypass all authentication checks and always render children
  console.log("⚠️ DEVELOPMENT MODE: Authentication bypassed for admin access");
  return children;

  /* Original authentication logic (commented out for now)
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiresAdmin) {
    // In a real app, you would check if the user has admin role
    // For now, we'll use a simple check based on email domain or hardcoded list
    const isAdmin =
      user.email?.endsWith("@admin.pockethr.com") ||
      user.email?.toLowerCase() === "craig@craig.com" ||
      user.app_metadata?.role === "admin" ||
      user.user_metadata?.role === "admin" ||
      false;
    console.log("Admin check:", {
      email: user.email,
      isAdmin,
      metadata: user.user_metadata,
    });
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
  */
};

function App() {
  const { user, loading } = useAuth();

  return (
    <ThemeProvider>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen w-screen bg-background">
            <p className="text-lg">Loading...</p>
          </div>
        }
      >
        <div className="min-h-screen w-full overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/thank-you" element={<ThankYou />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiresAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiresAdmin={true}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/plans"
              element={
                <ProtectedRoute requiresAdmin={true}>
                  <AdminPlans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/ai-assistant"
              element={
                <ProtectedRoute requiresAdmin={true}>
                  <AdminAIAssistant />
                </ProtectedRoute>
              }
            />

            {/* Add tempobook route for Tempo platform */}
            {import.meta.env.VITE_TEMPO === "true" && (
              <Route path="/tempobook/*" />
            )}
          </Routes>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        </div>
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
