import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Home,
  FileText,
  Users,
  Settings,
  LogOut,
  BookOpen,
  UserCheck,
  Shield,
  BarChart3,
  Menu,
  X,
  Bell,
  Search,
  Moon,
  Sun,
  Router,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import MySubmissions from "@/pages/author/MySubmissions";
import { useAuth } from "@/context/AuthContext";
// import {Link} from 'react-router-dom'

type UserRole = "admin" | "chief_editor" | "sub_editor" | "reviewer" | "author";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  userName?: string;
  userAvatar?: string;
}

const roleConfig: Record<
  UserRole,
  {
    label: string;
    color: string;
    navigation: { label: string; path: string; icon: React.ElementType }[];
  }
> = {
  admin: {
    label: "Super Admin",
    color: "text-destructive",
    navigation: [
      { label: "Dashboard", path: "/admin", icon: Home },
      { label: "Users", path: "/admin/users", icon: Users },
      { label: "All Papers", path: "/admin/papers", icon: FileText },
      { label: "System Logs", path: "/admin/logs", icon: BarChart3 },
      { label: "Settings", path: "/admin/settings", icon: Settings },
    ],
  },
  chief_editor: {
    label: "Chief Editor",
    color: "text-accent",
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
  sub_editor: {
    label: "Sub-Editor",
    color: "text-primary",
    navigation: [
      { label: "Dashboard", path: "/sub-editor", icon: Home },
      { label: "Assigned Papers", path: "/sub-editor/papers", icon: FileText },
      { label: "Reviewers", path: "/sub-editor/reviewers", icon: UserCheck },
      { label: "Mediation", path: "/sub-editor/mediation", icon: BookOpen },
    ],
  },
  reviewer: {
    label: "Reviewer",
    color: "text-info",
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
  author: {
    label: "Author",
    color: "text-success",
    navigation: [
      { label: "Dashboard", path: "/author", icon: Home },
      { label: "My Submissions", path: "/author/submissions", icon: FileText },
      { label: "Submit Paper", path: "/author/submit", icon: BookOpen },
    ],
  },
};

export function DashboardLayout({
  children,
  role,
  userName = "John Doe",
  userAvatar,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const location = useLocation();
  const config = roleConfig[role];
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  // inside AuthProvider
  // const handleLogout = async () => {
  //   try {
  //     logout();
  //   } catch (err) {
  //     console.error("Logout failed", err);
  //   }
  // };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const refreshToken = localStorage.getItem("accessToken");

      if (!refreshToken) {
        console.log("refreshToken ,missing", refreshToken);
      } else {
        const response = await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });

        const result = await response.json();
        console.log(result);

        if (result.success) {
          logout();
          navigate("/login");
        }
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 280 : 80,
          x: mobileMenuOpen
            ? 0
            : typeof window !== "undefined" && window.innerWidth < 1024
            ? -280
            : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-border/50 bg-card/80 backdrop-blur-xl",
          "flex flex-col",
          "lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-serif text-lg font-semibold">
                JournalHub
              </span>
            </motion.div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex h-8 w-8 p-0 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-muted-foreground"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div
          className={cn(
            "mx-4 mt-4 rounded-lg bg-muted/50 p-3",
            !sidebarOpen && "mx-2 p-2"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className={cn("h-4 w-4", config.color)} />
            </div>
            {sidebarOpen && (
              <div>
                <p className={cn("text-sm font-semibold", config.color)}>
                  {config.label}
                </p>
                <p className="text-xs text-muted-foreground">Active Session</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {config.navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    !sidebarOpen && "justify-center px-2"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/50 p-4">
          <div
            className={cn(
              "flex items-center gap-3",
              !sidebarOpen && "justify-center"
            )}
          >
            <Avatar className="h-10 w-10 border-2 border-border">
              <AvatarImage src={userAvatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {userName}
                </p>
                <Link to="/profile">
                  <p className="text-xs text-muted-foreground">View Profile</p>
                </Link>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                className="flex-1 justify-start bg-muted/50 hover:bg-muted text-muted-foreground"
              >
                <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.aside>

      <div
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "lg:pl-[280px]" : "lg:pl-20"
        )}
      >
        <header className="sticky top-0 z-30 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden h-9 w-9 p-0"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="hidden md:flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 w-[300px]">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search papers, users..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                  ⌘
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-9 w-9 p-0"
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 relative"
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
