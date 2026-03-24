import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import BrowsePage from "./pages/BrowseJournal.tsx";
import AuthorDashboard from "./pages/author/AuthorDashboard.tsx";
import ReviewerDashboard from "./pages/reviewer/ReviewerDashboard.tsx";
import ChiefEditorDashboard from "./pages/chiefEditor/ChiefEditorDashboard.tsx";
import SubEditorDashboard from "./pages/subEditor/SubEditorDashboard.tsx";
import RevisionPaper from "./pages/subEditor/RevisionPaper.tsx";
import PublisherDashboard from "./pages/publisher/publisherDashboard.tsx";
import CreateJournal from "./pages/publisher/CreateJournal.tsx";
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
import CEJournals from "./pages/chiefEditor/CEJournals.tsx";
import CEJournalDetail from "./pages/chiefEditor/CEJournalDetail.tsx";
import CEPapers from "./pages/chiefEditor/CEPapers.tsx";
import CETeam from "./pages/chiefEditor/CETeam.tsx";
import ResearchPaperDetail from "./pages/ResearchPaper.tsx";
import CompletedReview from "./pages/reviewer/completedReview.tsx";
import ReviewDetail from "./pages/reviewer/ReviewDetail.tsx";
import ArticlePage from "./pages/ArticlePage.tsx";
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
import TrackPaper from "./pages/author/TrackPaper.tsx";
import Archive from "./pages/Archive.tsx";
import AcceptInvitation from "./pages/AcceptInvitation.tsx";

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
                    <Route
                      path="/articles/:paperId"
                      element={<ArticlePage />}
                    />
                    <Route path="/archive" element={<Archive />} />
                  </Route>
                  {/* accept-invitation is outside PublicRoute so authenticated users can access it */}
                  <Route
                    path="/accept-invitation"
                    element={<AcceptInvitation />}
                  />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route element={<ProtectedRoute allowedRoles={["author"]} />}>
                    <Route path="/author" element={<AuthorDashboard />} />
                    <Route path="/author/submit" element={<SubmitPaper />} />
                    <Route path="/author/version" element={<PaperVersions />} />
                    <Route
                      path="/author/track/:paperId"
                      element={<TrackPaper />}
                    />
                  </Route>
                  <Route
                    element={
                      <ProtectedRoute
                        allowedRoles={["reviewer", "chief_editor"]}
                      />
                    }
                  >
                    <Route path="/reviewer" element={<ReviewerDashboard />} />

                    <Route
                      path="/reviewer/completed"
                      element={<CompletedReview />}
                    />
                    <Route
                      path="/reviewer/completed/:paperId"
                      element={<ReviewDetail />}
                    />
                  </Route>
                  <Route
                    element={
                      <ProtectedRoute
                        allowedRoles={["sub_editor", "chief_editor"]}
                      />
                    }
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
                    <Route
                      path="/chief-editor/journals"
                      element={<CEJournals />}
                    />
                    <Route
                      path="/chief-editor/journals/:journalId"
                      element={<CEJournalDetail />}
                    />
                    <Route path="/chief-editor/papers" element={<CEPapers />} />
                    <Route path="/chief-editor/team" element={<CETeam />} />
                  </Route>
                  <Route
                    element={<ProtectedRoute allowedRoles={["publisher"]} />}
                  >
                    <Route path="/publisher" element={<PublisherDashboard />} />
                    <Route
                      path="/publisher/create-journal"
                      element={<CreateJournal />}
                    />

                    <Route
                      path="/publisher/payments"
                      element={<PublisherPayments />}
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
