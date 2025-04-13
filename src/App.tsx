import { Suspense, lazy } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useSupabase";
import { CacheProvider } from "./contexts/CacheContext";

// Lazy load pages for better performance
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminPlans = lazy(() => import("./pages/admin/Plans"));
const AdminAIAssistant = lazy(() => import("./pages/admin/AIAssistant"));

// Protected route component
const ProtectedRoute = ({ children, requiresAdmin = false }) => {
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
    const isAdmin = user.user_metadata?.role === "admin" || false;
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

function App() {
  const { user, loading } = useAuth();

  return (
    <ThemeProvider>
      <CacheProvider>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen w-screen bg-background">
              <p className="text-lg">Loading...</p>
            </div>
          }
        >
          <div className="min-h-screen w-full overflow-x-hidden">
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/thank-you" element={<ThankYou />} />
              <Route path="/verify-email" element={<VerifyEmail />} />

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
      </CacheProvider>
    </ThemeProvider>
  );
}

export default App;
