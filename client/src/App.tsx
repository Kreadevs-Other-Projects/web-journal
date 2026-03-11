import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import BrowsePage from "./pages/BrowseJournal.tsx";
// import AuthorDashboard from "./pages/author/AuthorDashboard.tsx";
import ReviewerDashboard from "./pages/reviewer/ReviewerDashboard.tsx";
import ChiefEditorDashboard from "./pages/chiefEditor/ChiefEditorDashboard.tsx";
import SubEditorDashboard from "./pages/subEditor/SubEditorDashboard.tsx";
import RevisionPaper from "./pages/subEditor/RevisionPaper.tsx";
import PublisherDashboard from "./pages/publisher/publisherDashboard.tsx";
import PublishPapers from "./pages/publisher/PublishPapers.tsx";
import PublisherPayments from "./pages/publisher/Payments.tsx";
import OwnerDashboard from "./pages/owner/OwnerDashboard.tsx";
import Journals from "./pages/owner/Journals.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import NotFound from "./pages/NotFound";
// import MySubmissions from "./pages/author/MySubmissions.tsx";
import SubmitPaper from "./pages/author/SubmitPaper.tsx";
import PaperVersions from "./pages/author//PaperVersions.tsx";
import ReviewedPapers from "./pages/chiefEditor/ReviewedPapers.tsx";
import ResearchPaperDetail from "./pages/ResearchPaper.tsx";
import CompletedReview from "./pages/reviewer/completedReview.tsx";
import SignupPage from "./pages/SignupPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import PublisherManagerDashborad from "./pages/publisherManager/PublisherManagerDashborad.tsx";
import ProtectedRoute from "./components/ProtectedRoutes.tsx";
import Unauthorized from "./pages/Unauthorized.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import PublicRoute from "./components/PublicRoutes.tsx";
import InitialAuthCheck from "./components/InitialCheckout.tsx";
import JournalDetail from "./components/PaperDetail.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import AboutPage from "./pages/aboutUs.tsx";
import FAQPage from "./pages/faq.tsx";
import ContactPage from "./pages/contactUs.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <AnimatePresence mode="wait">
              <InitialAuthCheck>
                <Routes>
                  <Route
                    path="/initialCheckout"
                    element={<InitialAuthCheck children={""} />}
                  />
                  <Route element={<PublicRoute />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/contact-us" element={<ContactPage />} />

                    <Route path="/browse" element={<BrowsePage />} />
                    <Route path="/journal/:id" element={<JournalDetail />} />
                    <Route
                      path="/researchPapers/:paperId"
                      element={<ResearchPaperDetail />}
                    />
                  </Route>
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route element={<ProtectedRoute allowedRoles={["author"]} />}>
                    {/* <Route path="/author" element={<AuthorDashboard />} />
                    <Route
                    path="/author/submissions"
                      element={<MySubmissions />}
                    /> */}
                    <Route path="/author" element={<SubmitPaper />} />
                    <Route path="/author/version" element={<PaperVersions />} />
                  </Route>
                  <Route
                    element={<ProtectedRoute allowedRoles={["reviewer"]} />}
                  >
                    <Route path="/reviewer" element={<ReviewerDashboard />} />

                    <Route
                      path="/reviewer/completed"
                      element={<CompletedReview />}
                    />
                  </Route>
                  <Route
                    element={<ProtectedRoute allowedRoles={["sub_editor"]} />}
                  >
                    <Route
                      path="/sub-editor"
                      element={<SubEditorDashboard />}
                    />
                    <Route
                      path="/sub-editor/revision"
                      element={<RevisionPaper />}
                    />
                  </Route>
                  <Route
                    element={<ProtectedRoute allowedRoles={["chief_editor"]} />}
                  >
                    <Route
                      path="/chief-editor"
                      element={<ChiefEditorDashboard />}
                    />
                    <Route
                      path="/chief-editor/accepted"
                      element={<ReviewedPapers />}
                    />
                  </Route>
                  <Route
                    element={<ProtectedRoute allowedRoles={["publisher"]} />}
                  >
                    <Route path="/publisher" element={<PublisherDashboard />} />

                    <Route
                      path="/publisher/payments"
                      element={<PublisherPayments journalId={""} />}
                    />
                  </Route>

                  <Route
                    element={
                      <ProtectedRoute
                        allowedRoles={["publisher", "journal_manager"]}
                      />
                    }
                  >
                    <Route
                      path="/publisher/publish-paper"
                      element={<PublishPapers />}
                    />
                  </Route>
                  <Route
                    element={
                      <ProtectedRoute allowedRoles={["journal_manager"]} />
                    }
                  >
                    <Route
                      path="/publisher-manager"
                      element={<PublisherManagerDashborad />}
                    />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
                    <Route path="/owner" element={<OwnerDashboard />} />
                    <Route path="/journals" element={<Journals />} />
                  </Route>
                  {/* <Route path="/sub-editor" element={<AuthorDashboard />} /> */}
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/*" element={<AdminDashboard />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/profile" element={<ProfilePage />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </InitialAuthCheck>
            </AnimatePresence>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
