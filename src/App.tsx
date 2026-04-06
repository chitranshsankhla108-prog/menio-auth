import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CafeProvider } from "./contexts/CafeContext";

// Auth & Protection
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Staff Layout (Keep standard import for the main shell)
import { StaffLayout } from "./components/staff/StaffLayout";

// 1. LAZY LOAD: Dashboard sub-pages to keep the login screen fast
const MenuManager = lazy(() => import("./components/staff/MenuManager").then(m => ({ default: m.MenuManager })));
const OrderEntry = lazy(() => import("./components/staff/OrderEntry").then(m => ({ default: m.OrderEntry })));
const FeedbackList = lazy(() => import("./components/staff/FeedbackList").then(m => ({ default: m.FeedbackList })));
const StaffSettings = lazy(() => import("./components/staff/StaffSettings").then(m => ({ default: m.StaffSettings })));

const queryClient = new QueryClient();

// 2. DASHBOARD LOADER: A professional looking skeleton/spinner for the POS
const DashboardLoader = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FDF8F7]">
    <div className="w-10 h-10 border-4 border-[#3A2C2C]/10 border-t-[#3A2C2C] rounded-full animate-spin mb-4" />
    <p className="text-[#3A2C2C] font-sans font-bold text-xs uppercase tracking-widest">Loading Command Center...</p>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <CafeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<DashboardLoader />}>
              <Routes>
                {/* 3. REDIRECT: Landing on '/' now takes you straight to the Dashboard */}
                <Route path="/" element={<Navigate to="/staff" replace />} />
                
                {/* Auth Page */}
                <Route path="/auth" element={<Auth />} />

                {/* 4. STAFF DASHBOARD: Fully protected */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute requireStaff>
                      <StaffLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<MenuManager />} />
                  <Route path="orders" element={<OrderEntry />} />
                  <Route path="feedback" element={<FeedbackList />} />
                  <Route path="settings" element={<StaffSettings />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CafeProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;