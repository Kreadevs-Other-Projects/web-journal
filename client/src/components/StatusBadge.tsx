import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type PaperStatus = 
  | "submitted"
  | "assigned"
  | "under_review"
  | "pending_review"
  | "pending_revision"
  | "resubmitted"
  | "accepted"
  | "published"
  | "rejected";

interface StatusBadgeProps {
  status: PaperStatus;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

const statusConfig: Record<PaperStatus, { label: string; className: string; dotColor: string }> = {
  submitted: {
    label: "Submitted",
    className: "bg-info/10 text-info border-info/20",
    dotColor: "bg-info",
  },
  assigned: {
    label: "Assigned",
    className: "bg-primary/10 text-primary border-primary/20",
    dotColor: "bg-primary",
  },
  under_review: {
    label: "Under Review",
    className: "bg-warning/10 text-warning border-warning/20",
    dotColor: "bg-warning",
  },
  pending_review: {
    label: "Pending Review",
    className: "bg-accent/10 text-accent border-accent/20",
    dotColor: "bg-accent",
  },
  pending_revision: {
    label: "Pending Revision",
    className: "bg-accent/10 text-accent border-accent/20",
    dotColor: "bg-accent",
  },
  resubmitted: {
    label: "Resubmitted",
    className: "bg-info/10 text-info border-info/20",
    dotColor: "bg-info",
  },
  accepted: {
    label: "Accepted",
    className: "bg-success/10 text-success border-success/20",
    dotColor: "bg-success",
  },
  published: {
    label: "Published",
    className: "bg-success/10 text-success border-success/20 glow-success",
    dotColor: "bg-success",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    dotColor: "bg-destructive",
  },
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-3 py-1 text-xs",
  lg: "px-4 py-1.5 text-sm",
};

export function StatusBadge({ 
  status, 
  size = "md", 
  animated = true,
  className 
}: StatusBadgeProps) {
  const config = statusConfig[status];
  
  const BadgeContent = (
    <>
      <span className={cn(
        "h-1.5 w-1.5 rounded-full",
        config.dotColor,
        animated && "animate-pulse-glow"
      )} />
      <span className="font-semibold tracking-wider uppercase">{config.label}</span>
    </>
  );

  if (animated) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border",
          config.className,
          sizeClasses[size],
          className
        )}
      >
        {BadgeContent}
      </motion.span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border",
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {BadgeContent}
    </span>
  );
}
