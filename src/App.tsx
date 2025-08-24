import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import AuthPage from "./pages/auth/AuthPage";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Timetable from "./pages/Timetable";
import ConfirmationRequired from "./pages/auth/ConfirmationRequired";
import Classrooms from "./pages/Classrooms";
import ClassroomDetail from "./pages/ClassroomDetail";
import CalendarPage from "./pages/Calendar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/confirmation-required" element={<ConfirmationRequired />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/timetable"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Timetable />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CalendarPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/classrooms"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Classrooms />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/classrooms/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClassroomDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;