import {
  BookOpen,
  User,
  Users,
  UserCheck,
  Shield,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

export type UserRole = "author" | "reviewer" | "editor" | "publisher";

export const roleConfig: Record<
  UserRole,
  {
    icon: React.ElementType;
    label: string;
    description: string;
    color: string;
    route: string;
  }
> = {
  author: {
    icon: User,
    label: "Author",
    description: "Submit and track your research papers",
    color: "text-success",
    route: "/author",
  },
  reviewer: {
    icon: UserCheck,
    label: "Reviewer",
    description: "Evaluate submissions assigned to you",
    color: "text-info",
    route: "/reviewer",
  },
  editor: {
    icon: Users,
    label: "Editor",
    description: "Manage paper assignments and reviews",
    color: "text-accent",
    route: "/chief-editor",
  },
  publisher: {
    icon: Shield,
    label: "Publisher",
    description: "Journal publisher",
    color: "text-destructive",
    route: "/publisher",
  },
};
