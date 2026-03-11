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
  | "journal_manager"
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
      {
        label: "Publish Paper",
        path: "/publisher/publish-paper",
        icon: FileText,
      },
      { label: "Payments", path: "/publisher/payments", icon: Users },
    ],
  },

  journal_manager: {
    icon: BarChart3,
    label: "Journal Manager",
    color: "text-warning",
    description: "Manage publisher operations and reports",
    route: "/publisher-manager",
    navigation: [
      { label: "Dashboard", path: "/publisher-manager", icon: Home },
      {
        label: "Publish Paper",
        path: "/publisher/publish-paper",
        icon: FileText,
      },
      // {
      //   label: "Analytics",
      //   path: "/publisher-manager/analytics",
      //   icon: BarChart3,
      // },
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
      // {
      //   label: "Papers",
      //   path: "/chief-editor/papers",
      //   icon: FileText,
      // },
      { label: "Reviewed Papers", path: "/chief-editor/accepted", icon: Users },
      // { label: "Analytics", path: "/chief-editor/analytics", icon: BarChart3 },
    ],
  },

  author: {
    icon: BookOpen,
    label: "Author",
    color: "text-success",
    description: "Submit and manage your papers",
    route: "/author",
    navigation: [
      // { label: "Dashboard", path: "/author", icon: Home },
      // { label: "My Submissions", path: "/author/submissions", icon: FileText },
      { label: "Submit Paper", path: "/author", icon: BookOpen },
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
      { label: "Dashboard", path: "/sub-editor", icon: Home },
      { label: "Revision Papers", path: "/sub-editor/revision", icon: Users },
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
      {
        label: "Completed Reviews",
        path: "/reviewer/completed",
        icon: UserCheck,
      },
    ],
  },
};
