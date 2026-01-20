import {
  Home,
  FileText,
  Users,
  BookOpen,
  UserCheck,
  BarChart3,
} from "lucide-react";

export type UserRole =
  | "author"
  | "reviewer"
  | "chief_editor"
  | "publisher"
  | "owner"
  | "sub_editor";

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
  owner: {
    icon: FileText,
    label: "Owner",
    color: "text-destructive",
    description: "Owner of the system",
    route: "/owner",
    navigation: [
      { label: "Dashboard", path: "/owner", icon: Home },
      { label: "Journals", path: "/journals", icon: Home },
      // { label: "System Settings", path: "/owner/settings", icon: Settings },
    ],
  },
  publisher: {
    icon: Home,
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
  chief_editor: {
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
      { label: "Paper Version", path: "/author/version", icon: BookOpen },
    ],
  },
  sub_editor: {
    icon: Users,
    label: "Sub Editor",
    color: "text-destructive",
    description: "Manage paper editions",
    route: "/sub-editor",
    navigation: [
      { label: "Dashboard", path: "/editor", icon: Home },
      { label: "Users", path: "/editor/users", icon: Users },
      { label: "All Papers", path: "/editor/papers", icon: FileText },
      { label: "System Logs", path: "/editor/logs", icon: BarChart3 },
      // { label: "Settings", path: "/editor/settings", icon: Settings },
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
};
