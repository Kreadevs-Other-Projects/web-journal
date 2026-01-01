import { DashboardLayout } from "@/components/DashboardLayout";
import { PaperCard } from "@/components/PaperCard";
import { PaperTimeline } from "@/components/PaperTimeline";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "@/components/AnimationWrappers";
import { motion } from "framer-motion";
import { FileText, Clock, CheckCircle2, Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const sampleSubmissions = [
  {
    id: "SUB-2026-042",
    title: "Machine Learning Approaches for Climate Pattern Recognition",
    category: "Machine Learning",
    keywords: ["ML", "Climate", "Pattern Recognition"],
    status: "under_review" as const,
    currentVersion: "v1.2",
    submittedAt: "Dec 15, 2025",
  },
  {
    id: "SUB-2026-038",
    title: "Quantum Error Correction in Noisy Environments",
    category: "Quantum Computing",
    keywords: ["Quantum", "Error Correction", "NISQ"],
    status: "pending_revision" as const,
    currentVersion: "v1.0",
    submittedAt: "Dec 10, 2025",
  },
];

const timelineEvents = [
  {
    id: "1",
    status: "submitted" as const,
    date: "Dec 15, 2025",
    description: "Paper submitted successfully",
    actor: "You",
  },
  {
    id: "2",
    status: "assigned" as const,
    date: "Dec 16, 2025",
    description: "Assigned to sub-editor",
    actor: "System",
  },
  {
    id: "3",
    status: "under_review" as const,
    date: "Dec 18, 2025",
    description: "Review in progress by 2 reviewers",
    isCurrent: true,
  },
];

export default function AuthorDashboard() {
  return (
    <DashboardLayout role="author" userName="">
      <PageTransition>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-serif-outfit text-3xl font-bold text-foreground">
                Welcome back, Dr. Chen
              </h1>
              <p className="text-muted-foreground">
                Track your submissions and manage your research papers.
              </p>
            </div>
            <Link to="/author/submit">
              <Button className="btn-physics bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Submit New Paper
              </Button>
            </Link>
          </div>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Send,
                label: "Total Submissions",
                value: 8,
                color: "text-primary",
              },
              {
                icon: Clock,
                label: "Under Review",
                value: 2,
                color: "text-warning",
              },
              {
                icon: FileText,
                label: "Pending Revision",
                value: 1,
                color: "text-accent",
              },
              {
                icon: CheckCircle2,
                label: "Published",
                value: 5,
                color: "text-success",
              },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <motion.div whileHover={{ y: -4 }} className="glass-card p-5">
                  <stat.icon className={`h-6 w-6 ${stat.color} mb-3`} />
                  <div className="text-3xl font-bold text-foreground mb-1">
                    <AnimatedCounter end={stat.value} duration={1.5} />
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent submissions */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-serif-outfit text-xl font-semibold text-foreground">
                Recent Submissions
              </h2>
              {sampleSubmissions.map((paper) => (
                <PaperCard key={paper.id} {...paper} />
              ))}
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h2 className="font-serif-outfit-outfit text-xl font-semibold text-foreground">
                Latest Activity
              </h2>
              <div className="glass-card p-4">
                <PaperTimeline events={timelineEvents} />
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
