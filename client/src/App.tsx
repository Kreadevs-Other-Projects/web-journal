import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import BrowsePage from "./pages/BrowsePage";
import AuthorDashboard from "./pages/AuthorDashboard";
import ReviewerDashboard from "./pages/ReviewerDashboard";
import ChiefEditorDashboard from "./pages/ChiefEditorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="dark">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/author" element={<AuthorDashboard />} />
              <Route path="/author/*" element={<AuthorDashboard />} />
              <Route path="/reviewer" element={<ReviewerDashboard />} />
              <Route path="/reviewer/*" element={<ReviewerDashboard />} />
              <Route path="/chief-editor" element={<ChiefEditorDashboard />} />
              <Route path="/chief-editor/*" element={<ChiefEditorDashboard />} />
              <Route path="/sub-editor" element={<AuthorDashboard />} />
              <Route path="/sub-editor/*" element={<AuthorDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
