import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import BrowsePage from "./pages/BrowsePage";
import AuthorDashboard from "./pages/author/AuthorDashboard.tsx";
import ReviewerDashboard from "./pages/reviewer/ReviewerDashboard.tsx";
import ChiefEditorDashboard from "./pages/cheifEditor/ChiefEditorDashboard.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import NotFound from "./pages/NotFound";
import MySubmissions from "./pages/author/MySubmissions.tsx";
import AssignedPapers from "./pages/reviewer/AssignedPapers.tsx";
import Submissions from "./pages/cheifEditor/submissions.tsx";
import ResearchPaperDetail from "./pages/ResearchPaper.tsx";
import CompletedReview from "./pages/reviewer/completedReview.tsx";

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
              <Route path="/author/submissions" element={<MySubmissions />} />
              {/* <Route path="/author/*" element={<AuthorDashboard />} /> */}
              <Route path="/reviewer" element={<ReviewerDashboard />} />
              <Route path="/reviewer/papers" element={<AssignedPapers />} />
              <Route path="/reviewer/completed" element={<CompletedReview />} />
              {/* <Route path="/reviewer/*" element={<ReviewerDashboard />} /> */}
              <Route path="/chief-editor" element={<ChiefEditorDashboard />} />
              <Route
                path="/chief-editor/submissions"
                element={<Submissions />}
              />
              {/* <Route path="/chief-editor/*" element={<ChiefEditorDashboard />} /> */}
              <Route path="/sub-editor" element={<AuthorDashboard />} />
              <Route path="/sub-editor/*" element={<Submissions />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/researchPapers/:paperId" element={<ResearchPaperDetail />}/>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
