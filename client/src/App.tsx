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
import Submissions from "./pages/cheifEditor/Submissions.tsx";
import ResearchPaperDetail from "./pages/ResearchPaper.tsx";
import CompletedReview from "./pages/reviewer/completedReview.tsx";
import SignupPage from "./pages/SignupPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import ProtectedRoute from "./components/ProtectedRoutes.tsx";
import Unauthorized from "./pages/Unauthorized.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import PublicRoute from "./components/PublicRoutes.tsx";
import InitialAuthCheck from "./components/InitialCheckout.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <div className="dark">
            <AnimatePresence mode="wait">
              <InitialAuthCheck>
                <Routes>
                  {/* {Public Routes} */}
                  
                  <Route
                    path="/initialCheckout"
                    element={<InitialAuthCheck children={""} />}
                  />
                  <Route element={<PublicRoute />}>
                  <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                  </Route>

                  <Route path="/browse" element={<BrowsePage />} />
                  <Route
                    path="/researchPapers/:paperId"
                    element={<ResearchPaperDetail />}
                  />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  {/* {Author Routes} */}
                  <Route element={<ProtectedRoute allowedRoles={["author"]} />}>
                    <Route path="/author" element={<AuthorDashboard />} />
                    <Route
                      path="/author/submissions"
                      element={<MySubmissions />}
                    />
                  </Route>
                  {/* {Reviewer Routes} */}
                  <Route
                    element={<ProtectedRoute allowedRoles={["reviewer"]} />}
                  >
                    <Route path="/reviewer" element={<ReviewerDashboard />} />
                    <Route
                      path="/reviewer/papers"
                      element={<AssignedPapers />}
                    />
                    <Route
                      path="/reviewer/completed"
                      element={<CompletedReview />}
                    />
                  </Route>
                  {/* {Chief-Editor Routes} */}
                  <Route element={<ProtectedRoute allowedRoles={["editor"]} />}>
                    <Route
                      path="/chief-editor"
                      element={<ChiefEditorDashboard />}
                    />
                    <Route
                      path="/chief-editor/submissions"
                      element={<Submissions />}
                    />
                  </Route>
                  {/* <Route path="/sub-editor" element={<AuthorDashboard />} /> */}
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/*" element={<AdminDashboard />} />
                  <Route path="*" element={<NotFound />} />
                  {/* {Any logged in users Routes} */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/profile" element={<ProfilePage />} />
                  </Route>
                </Routes>
              </InitialAuthCheck>
            </AnimatePresence>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
