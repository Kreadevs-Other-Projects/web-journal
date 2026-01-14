import {
  Home,
  FileText,
  Users,
  Settings,
  BookOpen,
  UserCheck,
  BarChart3,
} from "lucide-react";

export type UserRole =
  | "author"
  | "reviewer"
  | "editor"
  | "publisher"
  | "owner"
  | "admin";

export const roleConfig: Record<
  UserRole,
  {
    icon: React.ElementType;
    label: string;
    color: string;
    navigation: { label: string; path: string; icon: React.ElementType }[];
    description: string;
    route: string;
  }
> = {
  admin: {
    icon: Home, // <-- required
    label: "Super Admin",
    color: "text-destructive",
    description: "Manage the entire system",
    route: "/admin", // default landing route
    navigation: [
      { label: "Dashboard", path: "/admin", icon: Home },
      { label: "Users", path: "/admin/users", icon: Users },
      { label: "All Papers", path: "/admin/papers", icon: FileText },
      { label: "System Logs", path: "/admin/logs", icon: BarChart3 },
      { label: "Settings", path: "/admin/settings", icon: Settings },
    ],
  },
  author: {
    icon: BookOpen,
    label: "Author",
    color: "text-success",
    description: "Submit and manage your papers",
    route: "/author",
    navigation: [
      { label: "Dashboard", path: "/author", icon: Home },
      { label: "My Submissions", path: "/author/submissions", icon: FileText },
      { label: "Submit Paper", path: "/author/submit", icon: BookOpen },
    ],
  },
  reviewer: {
    icon: UserCheck,
    label: "Reviewer",
    color: "text-info",
    description: "Review assigned papers",
    route: "/reviewer",
    navigation: [
      { label: "Dashboard", path: "/reviewer", icon: Home },
      { label: "Assigned Papers", path: "/reviewer/papers", icon: FileText },
      {
        label: "Completed Reviews",
        path: "/reviewer/completed",
        icon: UserCheck,
      },
    ],
  },
  editor: {
    icon: Users,
    label: "Chief Editor",
    color: "text-accent",
    description: "Manage submissions and editors",
    route: "/chief-editor",
    navigation: [
      { label: "Dashboard", path: "/chief-editor", icon: Home },
      {
        label: "Submissions",
        path: "/chief-editor/submissions",
        icon: FileText,
      },
      { label: "Sub-Editors", path: "/chief-editor/sub-editors", icon: Users },
      { label: "Analytics", path: "/chief-editor/analytics", icon: BarChart3 },
    ],
  },
  publisher: {
    icon: FileText,
    label: "Publisher",
    color: "text-destructive",
    description: "Manage all papers and users",
    route: "/publisher",
    navigation: [
      { label: "Dashboard", path: "/publisher", icon: Home },
      { label: "All Papers", path: "/publisher/papers", icon: FileText },
      { label: "Users", path: "/publisher/users", icon: Users },
    ],
  },
  owner: {
    icon: Home,
    label: "Owner",
    color: "text-destructive",
    description: "Owner of the system",
    route: "/owner",
    navigation: [
      { label: "Dashboard", path: "/owner", icon: Home },
      { label: "System Settings", path: "/owner/settings", icon: Settings },
    ],
  },
};
